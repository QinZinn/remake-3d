"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRightIcon } from "./Icons";

const STAGES = [
  {
    id: 1,
    code: "01",
    label: "Raw bottle",
    note: "1.5–2 L PET bottle · rinsed & stripped",
    href: "/project/pet-self-watering-planter#step-1",
  },
  {
    id: 2,
    code: "02",
    label: "Mark & cut",
    note: "Score ring 110 mm from base · smooth edge",
    href: "/project/pet-self-watering-planter#step-3",
  },
  {
    id: 3,
    code: "03",
    label: "Invert & wick",
    note: "Top cone nests in reservoir · cotton wick feeds soil",
    href: "/project/pet-self-watering-planter#step-8",
  },
] as const;

export default function HeroDraftingPlate() {
  const [stage, setStage] = useState<1 | 2 | 3>(2);
  const active = STAGES[stage - 1];

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-[4px] border border-[#2C332E] bg-[var(--bg-board)] text-[#ECEFEB]">
      {/* Plate title bar */}
      <div className="flex items-center justify-between gap-3 border-b border-[#313832] px-4 py-2.5 text-xs">
        <span className="font-mono-spec truncate tracking-[0.03em] text-[#D7DDD7]">
          PLATE 01 · PET PLANTER
        </span>
        <span className="font-mono-spec shrink-0 whitespace-nowrap text-[#F08A73]">
          50 g · 9 STEPS
        </span>
      </div>

      {/* Interactive orthographic drafting canvas */}
      <div className="relative flex min-h-[16.5rem] items-center justify-center px-5 py-6 sm:min-h-[18.5rem]">
        {/* Corner registration ticks */}
        <span aria-hidden="true" className="pointer-events-none absolute top-3 left-3 h-3 w-3 border-t border-l border-[#F9FBF8]/25" />
        <span aria-hidden="true" className="pointer-events-none absolute top-3 right-3 h-3 w-3 border-t border-r border-[#F9FBF8]/25" />
        <span aria-hidden="true" className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-[#F9FBF8]/25" />
        <span aria-hidden="true" className="pointer-events-none absolute right-3 bottom-3 h-3 w-3 border-r border-b border-[#F9FBF8]/25" />

        <svg
          viewBox="0 0 320 220"
          fill="none"
          role="img"
          aria-label={`Orthographic assembly diagram: ${active.label} — ${active.note}`}
          className="h-52 w-full max-w-[20rem] sm:h-56"
        >
          <defs>
            <pattern id="bp-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F9FBF8" strokeOpacity="0.06" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="320" height="220" fill="url(#bp-grid)" />
          {/* Baseline bench line */}
          <line x1="28" y1="194" x2="292" y2="194" stroke="#FAF7F1" strokeOpacity="0.22" strokeWidth="1" />
          {/* Center axis */}
          <line x1="160" y1="14" x2="160" y2="202" stroke="#FAF7F1" strokeOpacity="0.16" strokeWidth="1" strokeDasharray="4 4" />

          {stage === 1 && (
            <g>
              {/* Full intact PET bottle */}
              <rect x="148" y="24" width="24" height="10" stroke="#99C5DC" strokeWidth="1.6" />
              <path
                d="M151 34v10l-25 18v126a6 6 0 0 0 6 6h56a6 6 0 0 0 6-6V62l-25-18V34"
                stroke="#F2EDE3"
                strokeWidth="1.75"
                strokeLinejoin="miter"
              />
              {/* Bottle ribs */}
              <path d="M126 124h68M126 150h68" stroke="#F2EDE3" strokeOpacity="0.3" strokeWidth="1" />
              {/* Height dimension */}
              <line x1="226" y1="24" x2="226" y2="194" stroke="#B7C0B9" strokeWidth="1" />
              <line x1="221" y1="24" x2="231" y2="24" stroke="#B7C0B9" strokeWidth="1" />
              <line x1="221" y1="194" x2="231" y2="194" stroke="#B7C0B9" strokeWidth="1" />
              <text x="236" y="114" fill="#D7D0C1" fontSize="10" fontFamily="monospace">210 mm</text>
              {/* Diameter callout */}
              <line x1="126" y1="208" x2="194" y2="208" stroke="#B7C0B9" strokeWidth="1" />
              <text x="140" y="218" fill="#D7D0C1" fontSize="10" fontFamily="monospace">Ø 92 mm</text>
            </g>
          )}

          {stage === 2 && (
            <g>
              {/* Upper bottle half lifting slightly */}
              <g transform="translate(0, -10)">
                <rect x="148" y="24" width="24" height="10" stroke="#99C5DC" strokeWidth="1.6" />
                <path
                  d="M151 34v10l-25 18v48h68V62l-25-18V34"
                  stroke="#F2EDE3"
                  strokeWidth="1.75"
                  strokeLinejoin="miter"
                />
                <text x="52" y="72" fill="#D7D0C1" fontSize="10" fontFamily="monospace">TOP CONE</text>
                <line x1="108" y1="69" x2="128" y2="69" stroke="#D7D0C1" strokeOpacity="0.5" strokeWidth="1" />
              </g>
              {/* Vermilion cut plane */}
              <line x1="88" y1="108" x2="232" y2="108" stroke="#E85A3C" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M84 104 92 108 84 112M236 104 228 108 236 112" stroke="#E85A3C" strokeWidth="1.4" />
              <text x="240" y="111" fill="#F08A73" fontSize="10" fontFamily="monospace">CUT 01</text>

              {/* Lower reservoir half */}
              <g transform="translate(0, 6)">
                <path
                  d="M126 112v70a6 6 0 0 0 6 6h56a6 6 0 0 0 6-6v-70"
                  stroke="#F2EDE3"
                  strokeWidth="1.75"
                />
                <path d="M126 146h68" stroke="#99C5DC" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="3 3" />
                <text x="48" y="162" fill="#D7D0C1" fontSize="10" fontFamily="monospace">RESERVOIR</text>
                <line x1="110" y1="159" x2="126" y2="159" stroke="#D7D0C1" strokeOpacity="0.5" strokeWidth="1" />
              </g>
            </g>
          )}

          {stage === 3 && (
            <g>
              {/* Reservoir base */}
              <path
                d="M126 92v96a6 6 0 0 0 6 6h56a6 6 0 0 0 6-6V92"
                stroke="#F2EDE3"
                strokeWidth="1.75"
              />
              {/* Water level */}
              <path d="M128 158h64v30a4 4 0 0 1-4 4h-56a4 4 0 0 1-4-4v-30Z" fill="#2A6D91" fillOpacity="0.32" />
              <line x1="128" y1="158" x2="192" y2="158" stroke="#85C1DF" strokeWidth="1.4" />

              {/* Inverted top funnel nested inside */}
              <path
                d="M126 92h68l-25 42v12h-18v-12l-25-42Z"
                fill="#4D4438"
                fillOpacity="0.48"
                stroke="#F2EDE3"
                strokeWidth="1.7"
                strokeLinejoin="miter"
              />
              {/* Cotton wick reaching into reservoir */}
              <path
                d="M160 100v82"
                stroke="#E85A3C"
                strokeWidth="2.4"
                strokeDasharray="4 2"
              />
              {/* Sprout */}
              <path d="M160 92V66" stroke="#8CC49E" strokeWidth="1.8" />
              <path d="M160 76c-11-12-23-10-25 0 9 3 18 3 25 0Z" fill="#8CC49E" fillOpacity="0.35" stroke="#8CC49E" strokeWidth="1.5" />
              <path d="M160 70c11-12 22-9 24 0-9 3-17 3-24 0Z" fill="#8CC49E" fillOpacity="0.35" stroke="#8CC49E" strokeWidth="1.5" />

              {/* Callouts */}
              <text x="208" y="108" fill="#D7D0C1" fontSize="10" fontFamily="monospace">INVERTED TOP</text>
              <line x1="194" y1="105" x2="205" y2="105" stroke="#D7D0C1" strokeOpacity="0.5" strokeWidth="1" />
              <text x="208" y="168" fill="#99C5DC" fontSize="10" fontFamily="monospace">WATER + WICK</text>
              <line x1="164" y1="165" x2="205" y2="165" stroke="#99C5DC" strokeOpacity="0.6" strokeWidth="1" />
            </g>
          )}
        </svg>
      </div>

      {/* Interactive stage switch + direct launch */}
      <div className="border-t border-[#313832] bg-[#161A18] p-3.5">
        <div
          role="group"
          aria-label="Preview assembly stages"
          className="grid grid-cols-3 gap-1.5"
        >
          {STAGES.map((item) => {
            const isSelected = stage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setStage(item.id)}
                className={`focus-ring flex min-h-10 flex-col items-start rounded-[3px] border px-2.5 py-1.5 text-left transition-colors ${
                  isSelected
                    ? "border-[#E85A3C] bg-[#262C28] text-[#FAF7F1]"
                    : "border-[#313832] bg-transparent text-[#C7C1B4] hover:border-[#5D665F] hover:text-[#FAF7F1]"
                }`}
              >
                <span className={`font-mono-spec text-[11px] ${isSelected ? "text-[#F08A73]" : "text-[#A7B0A8]"}`}>
                  {item.code}
                </span>
                <span className="text-xs font-semibold leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <p className="text-[#C7C1B4]">{active.note}</p>
          <Link
            href={active.href}
            className="focus-ring inline-flex items-center gap-1 rounded-[2px] font-semibold text-[#F08A73] underline-offset-4 hover:text-[#FAF7F1] hover:underline"
          >
            <span>Inspect in 3D</span>
            <ArrowUpRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
