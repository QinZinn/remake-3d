"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { formatGrams } from "@/lib/impact";
import { ArrowRightIcon, CheckIcon } from "./Icons";
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
      className={`rounded-[4px] border p-4 transition-colors ${
        made
          ? "border-[var(--accent-sage-rule)] bg-[var(--accent-sage-tint)]"
          : "border-[var(--rule)] bg-[var(--bg-plate)]"
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
              ? "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[4px] border border-[var(--accent-sage)] bg-[var(--accent-sage)] px-4 py-2 text-sm font-semibold text-[var(--bg-plate)] transition-colors hover:bg-[#164731]"
              : "action-primary focus-ring"
          }
        >
          {made ? (
            <>
              <CheckIcon className="h-4 w-4" />
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
            className="focus-ring ml-auto inline-flex items-center gap-1 rounded-[2px] text-sm font-semibold text-[var(--accent-sage)] underline-offset-4 hover:underline"
          >
            <span>View your impact</span>
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <p
        className={`mt-2.5 text-xs leading-relaxed ${
          made ? "text-[#1A4330]" : "text-[var(--ink-muted)]"
        }`}
      >
        {made
          ? grams > 0
            ? `Counted once on this device (≈ ${formatGrams(grams)} estimated reused).`
            : "Counted once on this device."
          : grams > 0
            ? `Adds ≈ ${formatGrams(grams)} estimated reused material. Counted once on this device.`
            : "Saved locally on this device. Each guide is counted once."}
      </p>

      {storageUnavailable && (
        <p role="status" className="mt-2 text-xs font-medium text-[var(--accent-ochre)]">
          Browser storage is unavailable, so changes apply only until you reload.
        </p>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
