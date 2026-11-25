import Link from "next/link";

export default function CatalogHeader({ active }: { active?: "catalog" | "find" | "impact" }) {
  return (
    <header className="border-b border-stone-200/85 bg-[#f7f8f5]">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-5 gap-y-2 px-5 py-2 sm:px-8">
        <Link href="/" className="focus-ring rounded-sm text-lg font-bold tracking-tight text-emerald-950">
          ReMake <span className="text-emerald-700">3D</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1.5 text-sm font-medium sm:gap-3">
          <Link
            href="/#catalog"
            aria-current={active === "catalog" ? "page" : undefined}
            className="focus-ring rounded-lg px-3 py-2 text-stone-700 hover:bg-stone-200/65 aria-[current=page]:bg-white aria-[current=page]:text-emerald-900"
          >
            Catalog
          </Link>
          <Link
            href="/find"
            aria-current={active === "find" ? "page" : undefined}
            className="focus-ring rounded-lg px-3 py-2 text-stone-700 hover:bg-stone-200/65 aria-[current=page]:bg-white aria-[current=page]:text-emerald-900"
          >
            Find projects
          </Link>
          <Link
            href="/impact"
            aria-current={active === "impact" ? "page" : undefined}
            className="focus-ring rounded-lg px-3 py-2 text-stone-700 hover:bg-stone-200/65 aria-[current=page]:bg-white aria-[current=page]:text-emerald-900"
          >
            Impact
          </Link>
        </nav>
      </div>
    </header>
  );
}
