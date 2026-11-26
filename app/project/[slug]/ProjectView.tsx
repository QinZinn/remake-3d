"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatGrams } from "@/lib/impact";
import type { Project } from "@/lib/scene/schema";
import { labelOf } from "@/lib/taxonomy";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CheckIcon,
  TipIcon,
  WarningIcon,
} from "@/app/components/Icons";
import MadeThisControl from "@/app/components/MadeThisControl";
import { streamThemeForMaterial } from "@/app/components/materialMeta";

const Player = dynamic(() => import("@/lib/scene/Player"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#e4e8e3] text-sm text-[#434843]">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#b53218] border-t-transparent motion-reduce:animate-none" aria-hidden="true" />
      <span className="font-mono-spec text-xs uppercase tracking-wider">Loading 3D studio…</span>
    </div>
  ),
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
  const [record, setRecord] = useState(false);

  // Deep link: /project/x#step-3 opens step 3 (also when the hash is edited later);
  // ?speed=0.25 slows animations and ?record=1 keeps the canvas capturable, for recording.
  useEffect(() => {
    const syncHash = () => setStep(readStepFromHash(n));
    syncHash();
    const q = new URLSearchParams(window.location.search);
    const sp = Number(q.get("speed"));
    if (sp > 0 && sp <= 4) setSpeed(sp);
    setRecord(q.get("record") === "1");
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [n]);

  const changeStep = useCallback(
    (k: number) => {
      const next = Math.max(0, Math.min(n, k));
      setStep(next);
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}${next ? `#step-${next}` : ""}`,
      );
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
    <div className="mx-auto flex max-w-[1600px] flex-col lg:h-screen lg:flex-row">
      {/* 3D Viewer: sticky top on mobile, expansive left studio column on desktop */}
      <section
        aria-label="3D preview"
        className="sticky top-0 z-10 h-[50vh] shrink-0 border-b border-[var(--rule)] bg-[#e4e8e3] lg:static lg:h-screen lg:flex-1 lg:border-r lg:border-b-0"
      >
        <Player
          project={project}
          step={step}
          onStepChange={changeStep}
          speed={speed}
          record={record}
        />
      </section>

      {/* Workshop Manual Column */}
      <div className="flex flex-col gap-7 bg-[var(--bg-paper)] px-5 py-6 sm:px-7 lg:w-[31rem] lg:overflow-y-auto lg:py-7">
        <header className="flex flex-col gap-4">
          <nav
            aria-label="Guide navigation"
            className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--rule)] pb-3 text-sm"
          >
            <Link
              href="/"
              className="focus-ring inline-flex items-center gap-1.5 rounded-[3px] font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink)]"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              <span>All projects</span>
            </Link>
            <Link
              href="/impact"
              className="focus-ring rounded-[3px] font-semibold text-[var(--accent-cobalt)] underline-offset-4 hover:text-[var(--accent-vermilion)] hover:underline"
            >
              Your impact
            </Link>
          </nav>

          <div>
            <h1 className="font-display text-2xl leading-[1.12] font-bold tracking-[-0.02em] text-[var(--ink)] sm:text-[1.75rem]">
              {project.title}
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-[var(--ink-secondary)] sm:text-[15px]">
              {project.summary}
            </p>
          </div>

          {/* Architectural spec strip */}
          <dl className="grid grid-cols-2 divide-x divide-y divide-[var(--rule)] overflow-hidden rounded-[4px] border border-[var(--rule)] bg-[var(--bg-plate)] sm:grid-cols-4 sm:divide-y-0">
            <div className="px-3 py-2.5">
              <dt className="font-mono-spec text-xs font-medium text-[var(--ink-muted)] uppercase">
                Level
              </dt>
              <dd className="mt-0.5 text-sm font-semibold capitalize text-[var(--ink)]">
                {project.difficulty}
              </dd>
            </div>
            <div className="px-3 py-2.5">
              <dt className="font-mono-spec text-xs font-medium text-[var(--ink-muted)] uppercase">
                Time
              </dt>
              <dd className="font-mono-spec mt-0.5 text-sm font-semibold text-[var(--ink)]">
                {project.timeMinutes} min
              </dd>
            </div>
            <div className="px-3 py-2.5">
              <dt className="font-mono-spec text-xs font-medium text-[var(--ink-muted)] uppercase">
                Steps
              </dt>
              <dd className="font-mono-spec mt-0.5 text-sm font-semibold text-[var(--ink)]">
                {n}
              </dd>
            </div>
            <div className="px-3 py-2.5">
              <dt className="font-mono-spec text-xs font-medium text-[var(--ink-muted)] uppercase">
                Reused
              </dt>
              <dd className="font-mono-spec mt-0.5 text-sm font-semibold text-[var(--accent-sage)]">
                {grams > 0 ? `≈ ${formatGrams(grams)}` : "—"}
              </dd>
            </div>
          </dl>

          <MadeThisControl slug={project.slug} title={project.title} grams={grams} />
        </header>

        {/* Bill of materials & tools */}
        <section
          aria-labelledby="needs"
          className="grid gap-5 border-t border-[var(--rule)] pt-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
        >
          <h2 id="needs" className="sr-only">
            What you need
          </h2>
          <div>
            <h3 className="font-display mb-2.5 text-sm font-bold tracking-[0.02em] text-[var(--ink)] uppercase">
              Materials
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-[var(--ink)]">
              {project.materials.map((m) => {
                const theme = streamThemeForMaterial(m.id);
                return (
                  <li key={m.id} className="flex items-start gap-2 leading-snug">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: theme.bar }}
                    />
                    <span>
                      <span className="font-medium">{labelOf(m.id)}</span>
                      {m.qty !== 1 && (
                        <span className="font-mono-spec text-xs text-[var(--ink-muted)]">
                          {" "}× {m.qty}
                        </span>
                      )}
                      {m.unit && (
                        <span className="text-[var(--ink-secondary)]"> — {m.unit}</span>
                      )}
                      {m.optional && (
                        <span className="ml-1 text-xs text-[var(--ink-muted)]">(optional)</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="font-display mb-2.5 text-sm font-bold tracking-[0.02em] text-[var(--ink)] uppercase">
              Tools
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-[var(--ink)]">
              {project.tools.map((t) => (
                <li key={t.id} className="flex items-start gap-2 leading-snug">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[var(--ink-muted)]"
                  />
                  <span>
                    <span className="font-medium">{labelOf(t.id)}</span>
                    {t.optional && (
                      <span className="ml-1 text-xs text-[var(--ink-muted)]">(optional)</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Interactive Assembly Stepper */}
        <section aria-labelledby="steps-h" className="border-t border-[var(--rule)] pt-6">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2
              id="steps-h"
              className="font-display text-sm font-bold tracking-[0.02em] text-[var(--ink)] uppercase"
            >
              Assembly steps
            </h2>
            <span className="font-mono-spec text-xs text-[var(--ink-muted)]">
              {step === 0 ? "Overview" : `Step ${String(step).padStart(2, "0")} of ${String(n).padStart(2, "0")}`}
            </span>
          </div>

          <ol ref={listRef} className="flex flex-col gap-2" data-testid="stepper">
            {project.steps.map((s, i) => {
              const k = i + 1;
              const active = k === step;
              const done = k < step;
              return (
                <li key={k} data-step={k} className="scroll-mt-[52vh] lg:scroll-mt-4">
                  <button
                    type="button"
                    onClick={() => changeStep(k)}
                    aria-current={active ? "step" : undefined}
                    className={`focus-ring flex w-full items-start gap-3 rounded-[4px] border p-3.5 text-left transition-colors ${
                      active
                        ? "border-[var(--ink)] bg-[var(--bg-plate)] shadow-[0_4px_14px_-8px_rgba(24,26,23,0.22)]"
                        : "border-transparent bg-[var(--bg-kraft)]/45 hover:border-[var(--rule)] hover:bg-[var(--bg-plate)]"
                    }`}
                  >
                    <span
                      className={`font-mono-spec mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] text-xs font-semibold ${
                        active
                          ? "bg-[var(--accent-vermilion)] text-[var(--bg-plate)]"
                          : done
                            ? "bg-[var(--accent-sage-tint)] text-[var(--accent-sage)]"
                            : "bg-[var(--bg-kraft)] text-[var(--ink-secondary)]"
                      }`}
                      aria-hidden="true"
                    >
                      {done ? <CheckIcon className="h-3.5 w-3.5" /> : String(k).padStart(2, "0")}
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col gap-2">
                      <span
                        className={`text-sm leading-snug ${
                          active
                            ? "font-display font-bold text-[var(--ink)]"
                            : "font-semibold text-[var(--ink-secondary)]"
                        }`}
                      >
                        {s.title}
                      </span>

                      {active && (
                        <>
                          <span className="text-sm leading-relaxed text-[var(--ink-secondary)]">
                            {s.text}
                          </span>
                          {s.warning && (
                            <span className="flex items-start gap-2 rounded-[3px] border border-[var(--accent-ochre-rule)] bg-[var(--accent-ochre-tint)] px-3 py-2 text-xs leading-relaxed text-[var(--accent-ochre)]">
                              <WarningIcon className="mt-0.5 h-4 w-4 shrink-0" />
                              <span>
                                <strong className="font-semibold">Safety: </strong>
                                {s.warning}
                              </span>
                            </span>
                          )}
                          {s.tip && (
                            <span className="flex items-start gap-2 rounded-[3px] border border-[#B5CEDD] bg-[#E3EEF4] px-3 py-2 text-xs leading-relaxed text-[#164A68]">
                              <TipIcon className="mt-0.5 h-4 w-4 shrink-0" />
                              <span>
                                <strong className="font-semibold">Tip: </strong>
                                {s.tip}
                              </span>
                            </span>
                          )}
                        </>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          {step === 0 && (
            <button
              type="button"
              onClick={() => changeStep(1)}
              className="action-primary focus-ring mt-4 w-full"
            >
              Start step 1
            </button>
          )}
        </section>

        {/* Sources */}
        <section
          aria-labelledby="sources-h"
          className="border-t border-[var(--rule)] pt-6 pb-2"
        >
          <h2
            id="sources-h"
            className="font-display mb-1.5 text-sm font-bold tracking-[0.02em] text-[var(--ink)] uppercase"
          >
            Sources
          </h2>
          <p className="mb-3.5 text-xs leading-relaxed text-[var(--ink-muted)]">
            Steps are written in our own words. These published guides inspired or back this project.
          </p>
          <ul className="flex flex-col gap-3 text-sm">
            {project.sources.map((src) => (
              <li
                key={src.url}
                className="rounded-[4px] border border-[var(--rule)] bg-[var(--bg-plate)] px-3.5 py-2.5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring inline-flex items-center gap-1 rounded-[2px] font-semibold text-[var(--accent-cobalt)] underline-offset-4 hover:text-[var(--accent-vermilion)] hover:underline"
                  >
                    <span>{src.title}</span>
                    <ArrowUpRightIcon className="h-3.5 w-3.5" />
                  </a>
                  <span className="text-xs text-[var(--ink-muted)]">{src.publisher}</span>
                </div>
                <div className="font-mono-spec mt-1 text-xs text-[var(--ink-muted)]">
                  License: {src.license}
                </div>
                {src.note && (
                  <p className="mt-1 text-xs leading-relaxed text-[var(--ink-secondary)]">
                    {src.note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
