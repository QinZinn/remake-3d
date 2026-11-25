"use client";

/**
 * 3D step player. Renders `stateAtStep(project, step)` and animates the
 * transition from what is on screen. All scene logic is in the pure modules
 * (ops.ts, transition.ts); this file only draws frames.
 *
 * Rendering is on demand (`frameloop="demand"`): frames are drawn only while a
 * transition or camera flight runs, or the user orbits. A still step costs
 * nothing, which matters on phones.
 *
 * Client-only: import it with `next/dynamic` and `ssr: false`.
 */
import { AdaptiveDpr, ContactShadows, Environment, Lightformer, OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ACESFilmicToneMapping, DoubleSide, FrontSide, Plane, Vector3, type Group, type Mesh } from "three";
import { clamp01, easeInOut } from "./math";
import type { Effect, Frame, RenderItem } from "./ops";
import type { Project } from "./schema";
import { buildGeometry, buildMaterial } from "./three";
import { cameraAtStep, planTransition, sampleTransition, type Transition } from "./transition";

const DEG = Math.PI / 180;
const DWELL_MS = 1600; // pause on each step while playing
const CAMERA_SECONDS = 1.3;
const MAX_DPR = 1.5;

export interface PlayerProps {
  project: Project;
  /** 0 = overview (nothing applied), k = after step k. */
  step: number;
  onStepChange(step: number): void;
  /** Animation speed multiplier (e.g. 0.25 for slow motion when recording). */
  speed?: number;
  /** Keep the drawing buffer for canvas capture (screen recording tools). Costs GPU; off by default. */
  record?: boolean;
  className?: string;
}

/** Shared per-frame source: every mesh reads the same sampled frame. */
interface FrameSource {
  tr: Transition;
  start: number | null;
  lastTime: number;
  last: Frame | null;
  finished: boolean;
  get(now: number): Frame;
}

function makeSource(tr: Transition, speed = 1): FrameSource {
  const scaled: Transition = speed === 1 ? tr : { ...tr, duration: tr.duration / speed };
  return {
    tr: scaled,
    start: null,
    lastTime: -1,
    last: null,
    finished: tr.duration <= 0,
    get(now) {
      if (this.start === null) this.start = now;
      if (this.last && now === this.lastTime) return this.last;
      this.lastTime = now;
      const t = (now - this.start) * speed;
      this.last = sampleTransition(tr, t);
      if (t >= tr.duration) this.finished = true;
      return this.last;
    },
  };
}

function keysOf(f: Frame) {
  return [...f.items.map((i) => `${i.key}|${i.primitive}|${i.preset}|${i.slice?.join(",") ?? ""}|${i.clip ? 1 : 0}`), ...f.effects.map((e) => e.key)].join(";");
}

/** Pull camera back gently on narrow viewports so wide objects never clip horizontally. */
function responsiveCameraPosition(position: readonly number[], target: readonly number[], aspect: number): Vector3 {
  const pos = new Vector3(...position);
  const tgt = new Vector3(...target);
  if (aspect < 1.08) {
    const pull = Math.min(1.52, 1.08 / Math.max(0.62, aspect));
    pos.sub(tgt).multiplyScalar(pull).add(tgt);
  }
  return pos;
}

export default function Player({ project, step, onStepChange, speed = 1, record = false, className }: PlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [settled, setSettled] = useState(true);
  const [dpr, setDpr] = useState(MAX_DPR);
  const n = project.steps.length;

  // Plan each transition from the step shown before; if that animation is
  // still running, start from the frame on screen (no pop to its end).
  const shownStep = useRef(step);
  const [source, setSource] = useState(() => makeSource(planTransition(project, step, step), speed));
  useEffect(() => {
    if (shownStep.current === step) return;
    const fromFrame = !source.finished && source.last ? source.last : undefined;
    setSource(makeSource(planTransition(project, shownStep.current, step, fromFrame), speed));
    setSettled(false);
    shownStep.current = step;
  }, [project, step, speed]); // eslint-disable-line react-hooks/exhaustive-deps

  const [progress, setProgress] = useState(1);
  const go = useCallback((k: number) => onStepChange(Math.max(0, Math.min(n, k))), [n, onStepChange]);

  // Stop playing at the end; otherwise advance after a pause once settled.
  useEffect(() => {
    if (!playing) return;
    if (step >= n) {
      setPlaying(false);
      return;
    }
    if (!settled) return;
    const t = setTimeout(() => go(step + 1), DWELL_MS);
    return () => clearTimeout(t);
  }, [playing, settled, step, n, go]);

  // Keyboard: arrows step.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight") go(step + 1);
      else if (e.key === "ArrowLeft") go(step - 1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, step]);

  const cam = cameraAtStep(project, step);
  const initialCam = cameraAtStep(project, 0);

  return (
    <div className={`flex h-full w-full flex-col ${className ?? ""}`} data-testid="player" data-step={step} data-settled={settled}>
      <div className="relative min-h-0 flex-1">
        <Canvas
          frameloop="demand"
          shadows
          dpr={dpr}
          camera={{ position: initialCam.position, fov: 35, near: 0.5, far: 1000 }}
          gl={{
            localClippingEnabled: true,
            antialias: true,
            preserveDrawingBuffer: record,
            toneMapping: ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
          onCreated={({ gl }) => {
            // Refraction through PET/glass renders the scene behind at half resolution.
            gl.transmissionResolutionScale = 0.5;
          }}
        >
          <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(MAX_DPR)} />
          <AdaptiveDpr pixelated />
          <color attach="background" args={["#edf2ee"]} />
          <hemisphereLight args={["#fafdfb", "#cfd7d1", 0.65]} />
          <directionalLight
            position={[24, 46, 30]}
            intensity={1.65}
            color="#fffcf5"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-left={-38}
            shadow-camera-right={38}
            shadow-camera-top={38}
            shadow-camera-bottom={-38}
            shadow-camera-near={5}
            shadow-camera-far={130}
            shadow-bias={-0.0004}
            shadow-normalBias={0.04}
          />
          <directionalLight position={[-26, 20, -18]} intensity={0.5} color="#e2eefb" />
          <Environment resolution={256}>
            <Lightformer intensity={2.6} position={[0, 32, -16]} rotation-x={Math.PI / 2} scale={[60, 30, 1]} />
            <Lightformer intensity={2.2} position={[0, 26, 26]} scale={[44, 18, 1]} />
            <Lightformer intensity={1.7} position={[-32, 16, 12]} rotation-y={Math.PI / 2} scale={[34, 14, 1]} />
            <Lightformer intensity={1.7} position={[32, 16, 12]} rotation-y={-Math.PI / 2} scale={[34, 14, 1]} />
            <Lightformer intensity={1.1} color="#fff1dc" position={[0, -10, 22]} scale={[46, 12, 1]} />
          </Environment>
          <SceneView source={source} onProgress={setProgress} onSettled={() => setSettled(true)} />
          {/* Soft ambient occlusion contact shadow drawn once when a step settles. */}
          <ContactShadows key={`${step}:${settled}`} frames={1} position={[0, -0.006, 0]} opacity={0.34} scale={64} blur={2.1} far={36} resolution={256} />
          {/* Subtle studio ground plane receiving soft directional shadows. */}
          <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -0.02, 0]}>
            <circleGeometry args={[400, 64]} />
            <meshStandardMaterial color="#e6ede8" roughness={0.96} metalness={0} />
          </mesh>
          <fog attach="fog" args={["#edf2ee", 125, 320]} />
          <OrbitControls makeDefault enableDamping minDistance={10} maxDistance={160} maxPolarAngle={Math.PI * 0.49} target={initialCam.target} />
          <CameraRig position={cam.position} target={cam.target} stepKey={step} />
        </Canvas>
      </div>

      <div className="flex flex-col gap-2 px-3 pt-1 pb-3">
        <div className="h-1 w-full overflow-hidden rounded-full bg-black/10" aria-hidden>
          <div className="h-full rounded-full bg-emerald-600 transition-[width] duration-150" style={{ width: `${((Math.max(0, step - 1) + (step === 0 ? 0 : progress)) / n) * 100}%` }} />
        </div>
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-1.5 shadow-sm">
          <button type="button" onClick={() => go(step - 1)} disabled={step <= 0} className="rounded-full px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-40" aria-label="Previous step">
            ← Prev
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (step >= n) {
                  go(0);
                  setPlaying(true);
                } else setPlaying((p) => !p);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-white shadow hover:bg-emerald-800"
              aria-label={playing ? "Pause" : "Play all steps"}
              data-testid="play"
            >
              {playing ? (
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><rect x="2" y="1" width="3.5" height="12" rx="1" fill="currentColor" /><rect x="8.5" y="1" width="3.5" height="12" rx="1" fill="currentColor" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M3 1.5v11l9.5-5.5z" fill="currentColor" /></svg>
              )}
            </button>
            <span className="min-w-20 text-center text-sm tabular-nums text-stone-600" aria-live="polite">
              {step === 0 ? "Overview" : `Step ${step} / ${n}`}
            </span>
          </div>
          <button type="button" onClick={() => go(step + 1)} disabled={step >= n} className="rounded-full px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-40" aria-label="Next step">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- scene

function SceneView({ source, onProgress, onSettled }: { source: FrameSource; onProgress(p: number): void; onSettled(): void }) {
  const clock = useThree((s) => s.clock);
  const invalidate = useThree((s) => s.invalidate);
  const [frame, setFrame] = useState<Frame>(() => source.get(clock.elapsedTime));
  const sig = useRef(keysOf(frame));
  const settledFor = useRef<FrameSource | null>(null);
  const lastProgress = useRef(-1);

  // A new transition needs frames.
  useEffect(() => invalidate(), [source, invalidate]);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    const f = source.get(now);
    const s = keysOf(f);
    if (s !== sig.current) {
      sig.current = s;
      setFrame(f);
    }
    const p = source.tr.duration > 0 && source.start !== null ? clamp01((now - source.start) / source.tr.duration) : 1;
    if (Math.abs(p - lastProgress.current) > 0.02 || (p === 1 && lastProgress.current !== 1)) {
      lastProgress.current = p;
      onProgress(p);
    }
    if (!source.finished) invalidate();
    else if (settledFor.current !== source) {
      settledFor.current = source;
      onSettled();
      invalidate(); // one more frame so the settled shadow renders
    }
  });

  return (
    <group>
      {frame.items.map((it) => (
        <ObjectMesh key={`${it.key}|${it.slice?.join(",") ?? ""}|${it.preset}`} item={it} source={source} />
      ))}
      {frame.effects.map((e) => (
        <EffectMesh key={e.key} effect={e} source={source} />
      ))}
    </group>
  );
}

const _plane = new Plane();
const _normal = new Vector3();

function ObjectMesh({ item, source }: { item: RenderItem; source: FrameSource }) {
  const mesh = useRef<Mesh>(null);
  const geometry = useMemo(() => buildGeometry(item), [item.primitive, item.params, item.slice]); // eslint-disable-line react-hooks/exhaustive-deps
  const material = useMemo(() => buildMaterial(item.preset), [item.preset]);
  const clipPlane = useMemo(() => new Plane(), []);
  const transmissive = item.preset === "pet" || item.preset === "glass";
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => {
    material.clippingPlanes = item.clip ? [clipPlane] : null;
    // Closed thickened glass/PET shells refract cleanly with FrontSide; keep DoubleSide while clipped.
    material.side = transmissive && !item.clip ? FrontSide : DoubleSide;
    material.needsUpdate = true;
  }, [material, clipPlane, item.clip, transmissive]);

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const f = source.get(clock.elapsedTime);
    const it = f.items.find((i) => i.key === item.key) ?? item;
    if (it.basis) {
      // Attached object: draw its exact composed transform.
      const [a, b, c, d, e, f, g, h, i] = it.basis;
      m.matrixAutoUpdate = false;
      m.matrix.set(a, b, c, it.position[0], d, e, f, it.position[1], g, h, i, it.position[2], 0, 0, 0, 1);
      m.matrixWorldNeedsUpdate = true;
    } else {
      m.matrixAutoUpdate = true;
      m.position.set(...it.position);
      m.rotation.set(it.rotation[0] * DEG, it.rotation[1] * DEG, it.rotation[2] * DEG, "XYZ");
      m.scale.set(...it.scale);
    }
    material.color.set(it.color);
    material.opacity = it.opacity;
    m.visible = it.opacity > 0.01;
    // Only fading objects go in the transparent queue (see three.ts).
    const fading = it.opacity < 0.999;
    if (material.transparent !== fading) {
      material.transparent = fading;
      material.depthWrite = !fading;
      material.needsUpdate = true;
    }
    const index = geometry.index;
    if (index) {
      const count = it.reveal === undefined ? Infinity : Math.floor((index.count * clamp01(it.reveal)) / 6) * 6;
      geometry.setDrawRange(0, count);
    }
    if (it.clip) {
      m.updateMatrixWorld();
      const keepBelow = it.clip.keep === "below";
      _normal.set(0, keepBelow ? -1 : 1, 0);
      _plane.set(_normal, keepBelow ? it.clip.y : -it.clip.y);
      clipPlane.copy(_plane).applyMatrix4(m.matrixWorld);
    }
  });

  return <mesh ref={mesh} geometry={geometry} material={material} castShadow={!transmissive} receiveShadow={!transmissive} />;
}

function EffectMesh({ effect, source }: { effect: Effect; source: FrameSource }) {
  const group = useRef<Group>(null);
  const [progress, setProgress] = useState(effect.progress);
  const shown = useRef(progress);
  useFrame(({ clock }) => {
    const e = source.get(clock.elapsedTime).effects.find((x) => x.key === effect.key);
    if (!e) return;
    const g = group.current;
    if (g) {
      g.position.set(...e.host.position);
      g.rotation.set(e.host.rotation[0] * DEG, e.host.rotation[1] * DEG, e.host.rotation[2] * DEG, "XYZ");
      g.scale.set(...e.host.scale);
    }
    const p = Math.round(e.progress * 48) / 48;
    if (p !== shown.current) {
      shown.current = p;
      setProgress(p);
    }
  });
  return (
    <group ref={group}>
      <mesh position={[0, effect.y, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[effect.radius * 1.025, 0.09, 8, 96, Math.max(0.001, progress) * Math.PI * 2]} />
        <meshBasicMaterial color="#f97316" toneMapped={false} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------- camera

function CameraRig({ position, target, stepKey }: { position: readonly number[]; target: readonly number[]; stepKey: number }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const controls = useThree((s) => s.controls) as unknown as { target: Vector3; update(): void } | null;
  const anim = useRef<{ fromPos: Vector3; fromTarget: Vector3; toPos: Vector3; toTarget: Vector3; start: number | null } | null>(null);
  const initialized = useRef(false);
  const aspect = size.width / Math.max(1, size.height);

  useEffect(() => {
    if (!controls) return;
    const toPos = responsiveCameraPosition(position, target, aspect);
    const toTarget = new Vector3(...target);
    if (!initialized.current) {
      initialized.current = true;
      camera.position.copy(toPos);
      controls.target.copy(toTarget);
      controls.update();
      invalidate();
      return;
    }
    anim.current = {
      fromPos: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPos,
      toTarget,
      start: null,
    };
    invalidate();
    // Only re-aim when the step, camera, or viewport aspect bucket changes.
  }, [stepKey, controls, Math.round(aspect * 20), position[0], position[1], position[2], target[0], target[1], target[2]]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(({ clock }) => {
    const a = anim.current;
    if (!a || !controls) return;
    if (a.start === null) a.start = clock.elapsedTime;
    const u = easeInOut(clamp01((clock.elapsedTime - a.start) / CAMERA_SECONDS));
    camera.position.lerpVectors(a.fromPos, a.toPos, u);
    controls.target.lerpVectors(a.fromTarget, a.toTarget, u);
    controls.update();
    if (u >= 1) anim.current = null;
    else invalidate();
  });
  return null;
}
