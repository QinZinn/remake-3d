import type { Metadata } from "next";
import { inventoryQuery, readInventory } from "@/lib/inventory";
import CatalogHeader from "../components/CatalogHeader";
import InventoryForm from "./InventoryForm";

export const metadata: Metadata = {
  title: "Find projects",
  description: "Find upcycling projects using materials and tools you already have.",
};

export default async function FindPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const inventory = readInventory(await searchParams);

  return (
    <>
      <CatalogHeader active="find" />
      <main className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
        <header className="mb-7 sm:mb-9">
          <h1 className="max-w-2xl font-serif text-[clamp(2.6rem,5.6vw,4.2rem)] leading-[1.05] tracking-tight text-balance text-emerald-950">
            What do you have on hand?
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-stone-600">
            Scan a photo or add the materials and tools you have to see what you can make.
          </p>
        </header>
        <InventoryForm key={inventoryQuery(inventory)} initialInventory={inventory} />
      </main>
    </>
  );
}
