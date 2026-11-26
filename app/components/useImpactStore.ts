"use client";

import { useSyncExternalStore } from "react";
import { createImpactStore, type ImpactSnapshot } from "@/lib/impact";

const browserImpactStore = createImpactStore({
  getStorage: () => (typeof window === "undefined" ? null : window.localStorage),
  getEventSource: () => (typeof window === "undefined" ? null : window),
});

export function useImpactSnapshot(): ImpactSnapshot {
  return useSyncExternalStore(
    browserImpactStore.subscribe,
    browserImpactStore.getSnapshot,
    browserImpactStore.getServerSnapshot,
  );
}

export function setProjectCompleted(slug: string, completed: boolean): boolean {
  return browserImpactStore.setCompleted(slug, completed);
}
