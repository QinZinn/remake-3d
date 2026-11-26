import type { Metadata } from "next";
import { inventoryQuery, readInventory } from "@/lib/inventory";
import CatalogHeader from "../components/CatalogHeader";
import InventoryForm from "./InventoryForm";

export const metadata: Metadata = {
  title: "Find projects",
  description: "Find upcycling projects using materials and tools you already have.",
};

export default async function FindPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const inventory = readInventory(await searchParams);

  return (
    <>
      <CatalogHeader active="find" />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-11">
        <header className="mb-7 border-b border-[var(--rule)] pb-6 sm:mb-8">
          <h1 className="font-display text-3xl leading-[1.08] font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-4xl">
            What do you have on hand?
          </h1>
          <p className="mt-2.5 max-w-[58ch] text-base leading-relaxed text-[var(--ink-secondary)]">
            Scan a photo on this device or pick your clean recyclables and household tools to match ready-to-build 3D guides.
          </p>
        </header>
        <InventoryForm key={inventoryQuery(inventory)} initialInventory={inventory} />
      </main>
    </>
  );
}
