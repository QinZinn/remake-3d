"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { formatGrams } from "@/lib/impact";
import { setProjectCompleted, useImpactSnapshot } from "./useImpactStore";

interface MadeThisControlProps {
  slug: string;
  title: string;
  grams: number;
}

export default function MadeThisControl({ slug, title, grams }: MadeThisControlProps) {
  const { completedSlugs, storageUnavailable } = useImpactSnapshot();
  const made = completedSlugs.includes(slug);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const [announcement, setAnnouncement] = useState("");

  function markMade() {
    setProjectCompleted(slug, true);
    setAnnouncement(`Marked ${title} as made. Counted once in your local impact.`);
  }

  function undoMade() {
    setProjectCompleted(slug, false);
    setAnnouncement(`Removed ${title} from your local impact.`);
    toggleButtonRef.current?.focus();
  }

  function handlePrimaryToggle() {
    if (made) {
      undoMade();
    } else {
      markMade();
    }
  }

  return (
    <div
      className={`mt-1 rounded-2xl border p-4 transition-colors ${
        made
          ? "border-emerald-700/25 bg-[#edf3e6]"
          : "border-stone-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          ref={toggleButtonRef}
          type="button"
          aria-pressed={made}
          onClick={handlePrimaryToggle}
          className={
            made
              ? "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-emerald-800/20 bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
              : "action-primary focus-ring"
          }
        >
          {made ? (
            <>
              <span aria-hidden>✓</span>
              <span>Made</span>
              <span className="sr-only"> — activate to undo</span>
            </>
          ) : (
            <span>I made this</span>
          )}
        </button>

        {made && (
          <button
            type="button"
            aria-label={`Undo completion for ${title}`}
            onClick={undoMade}
            className="action-secondary focus-ring"
          >
            Undo
          </button>
        )}

        {made && (
          <Link
            href="/impact"
            className="focus-ring ml-auto rounded-sm text-sm font-semibold text-emerald-900 underline-offset-4 hover:underline"
          >
            View your impact <span aria-hidden>→</span>
          </Link>
        )}
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-stone-600">
        {made
          ? grams > 0
            ? `Counted once on this device (≈ ${formatGrams(grams)} estimated reused).`
            : "Counted once on this device."
          : grams > 0
            ? `Adds ≈ ${formatGrams(grams)} estimated reused material. Counted once on this device.`
            : "Saved locally on this device. Each guide is counted once."}
      </p>

      {storageUnavailable && (
        <p role="status" className="mt-2 text-xs text-amber-900">
          Browser storage is unavailable, so changes apply only until you reload.
        </p>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
