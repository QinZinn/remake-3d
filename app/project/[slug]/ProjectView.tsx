"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/scene/schema";
import { labelOf } from "@/lib/taxonomy";

const Player = dynamic(() => import("@/lib/scene/Player"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-stone-500">Loading 3D preview…</div>,
});

function readStepFromHash(n: number): number {
  if (typeof window === "undefined") return 0;
  const m = /^#step-(\d+)$/.exec(window.location.hash);
  return m ? Math.min(n, Math.max(0, Number(m[1]))) : 0;
}

export default function ProjectView({ project }: { project: Project }) {
  const n = project.steps.length;
  const [step, setStep] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);

  const [speed, setSpeed] = useState(1);
  // Deep link: /project/x#step-3 opens step 3; ?speed=0.25 slows animations (for recording).
  useEffect(() => {
    setStep(readStepFromHash(n));
    const sp = Number(new URLSearchParams(window.location.search).get("speed"));
    if (sp > 0 && sp <= 4) setSpeed(sp);
  }, [n]);

  const changeStep = useCallback(
    (k: number) => {
      const next = Math.max(0, Math.min(n, k));
      setStep(next);
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${next ? `#step-${next}` : ""}`);
    },
    [n],
  );

  // Keep the active step visible in the list when the player changes it.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-step="${step}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [step]);

  const grams = project.wasteDiverted.reduce((a, w) => a + w.grams, 0);

  return (
    <div className="mx-auto flex max-w-7xl flex-col lg:h-screen lg:flex-row">
      {/* Viewer: sticky on top on mobile, left column on desktop. */}
      <section aria-label="3D preview" className="sticky top-0 z-10 h-[52vh] shrink-0 border-b border-stone-200 bg-[#eef3ef] lg:static lg:h-screen lg:flex-1 lg:border-r lg:border-b-0">
        <Player project={project} step={step} onStepChange={changeStep} speed={speed} />
      </section>

      <div className="flex flex-col gap-8 px-5 py-6 lg:w-[30rem] lg:overflow-y-auto lg:py-8">
        <header className="flex flex-col gap-3">
          <Link href="/" className="text-sm text-stone-500 hover:text-emerald-700">← All projects</Link>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{project.title}</h1>
          <p className="text-stone-600">{project.summary}</p>
          <dl className="flex flex-wrap gap-2 text-xs">
            <div className="rounded-full bg-stone-100 px-2.5 py-1"><dt className="sr-only">Difficulty</dt><dd className="capitalize">{project.difficulty}</dd></div>
            <div className="rounded-full bg-stone-100 px-2.5 py-1"><dt className="sr-only">Time</dt><dd>{project.timeMinutes} min</dd></div>
            <div className="rounded-full bg-stone-100 px-2.5 py-1"><dt className="sr-only">Steps</dt><dd>{n} steps</dd></div>
            {grams > 0 && <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800"><dt className="sr-only">Waste diverted</dt><dd>≈ {grams} g kept out of the bin</dd></div>}
          </dl>
        </header>

        <section aria-labelledby="needs" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <h2 id="needs" className="sr-only">What you need</h2>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-stone-500 uppercase">Materials</h3>
            <ul className="flex flex-col gap-1 text-sm">
              {project.materials.map((m) => (
                <li key={m.id} className="flex gap-2">
                  <span className="text-emerald-700">•</span>
                  <span>
                    {labelOf(m.id)}
                    {m.unit ? <span className="text-stone-500"> — {m.unit}</span> : m.qty > 1 ? <span className="text-stone-500"> × {m.qty}</span> : null}
                    {m.optional && <span className="ml-1 text-xs text-stone-400">(optional)</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-stone-500 uppercase">Tools</h3>
            <ul className="flex flex-col gap-1 text-sm">
              {project.tools.map((t) => (
                <li key={t.id} className="flex gap-2">
                  <span className="text-emerald-700">•</span>
                  <span>
                    {labelOf(t.id)}
                    {t.optional && <span className="ml-1 text-xs text-stone-400">(optional)</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="steps-h">
          <h2 id="steps-h" className="mb-3 text-sm font-semibold text-stone-500 uppercase">Steps</h2>
          <ol ref={listRef} className="flex flex-col gap-2" data-testid="stepper">
            {project.steps.map((s, i) => {
              const k = i + 1;
              const active = k === step;
              const done = k < step;
              return (
                <li key={k} data-step={k}>
                  <button
                    type="button"
                    onClick={() => changeStep(k)}
                    aria-current={active ? "step" : undefined}
                    className={`flex w-full gap-3 rounded-2xl border p-3 text-left transition ${active ? "border-emerald-600 bg-white shadow-sm" : "border-transparent hover:bg-white/70"}`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${active ? "bg-emerald-700 text-white" : done ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"}`}
                      aria-hidden
                    >
                      {done ? "✓" : k}
                    </span>
                    <span className="flex min-w-0 flex-col gap-1.5">
                      <span className={`font-medium ${active ? "text-stone-900" : "text-stone-700"}`}>{s.title}</span>
                      {active && (
                        <>
                          <span className="text-sm leading-relaxed text-stone-700">{s.text}</span>
                          {s.warning && <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-sm text-amber-900"><strong className="font-semibold">Safety: </strong>{s.warning}</span>}
                          {s.tip && <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-sm text-emerald-900"><strong className="font-semibold">Tip: </strong>{s.tip}</span>}
                        </>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          {step === 0 && (
            <button type="button" onClick={() => changeStep(1)} className="mt-3 w-full rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
              Start step 1
            </button>
          )}
        </section>

        <section aria-labelledby="sources-h" className="border-t border-stone-200 pt-5">
          <h2 id="sources-h" className="mb-2 text-sm font-semibold text-stone-500 uppercase">Sources</h2>
          <p className="mb-3 text-xs text-stone-500">Steps are written in our own words. These sources inspired or back the project.</p>
          <ul className="flex flex-col gap-3 text-sm">
            {project.sources.map((src) => (
              <li key={src.url}>
                <a href={src.url} target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-800 underline-offset-2 hover:underline">{src.title}</a>
                <span className="text-stone-500"> — {src.publisher}</span>
                <div className="text-xs text-stone-500">License: {src.license}</div>
                {src.note && <div className="text-xs text-stone-500">{src.note}</div>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
