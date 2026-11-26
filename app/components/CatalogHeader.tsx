import Link from "next/link";
import { BrandMark } from "./Icons";

export default function CatalogHeader({
  active,
}: {
  active?: "catalog" | "find" | "impact";
}) {
  const navItems = [
    { id: "catalog", href: "/#catalog", label: "Catalog" },
    { id: "find", href: "/find", label: "Find projects" },
    { id: "impact", href: "/impact", label: "Impact" },
  ] as const;

  return (
    <header className="border-b border-[var(--rule)] bg-[var(--bg-paper)]">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-2 px-4 py-2 sm:gap-4 sm:px-8">
        <Link
          href="/"
          className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-[3px] py-1 whitespace-nowrap text-[var(--ink)] sm:gap-2.5"
        >
          <BrandMark className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
          <span className="font-display text-base font-bold tracking-[-0.02em] sm:text-lg">
            ReMake <span className="text-[var(--accent-vermilion)]">3D</span>
          </span>
        </Link>

        <nav aria-label="Main" className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          {navItems.map((item) => {
            const isCurrent = active === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
                className={`focus-ring relative inline-flex min-h-10 items-center rounded-[3px] px-2 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors sm:px-3.5 sm:text-sm ${
                  isCurrent
                    ? "text-[var(--ink)] after:absolute after:right-2 after:bottom-0 after:left-2 after:h-[2px] after:bg-[var(--accent-vermilion)] sm:after:right-3.5 sm:after:left-3.5"
                    : "text-[var(--ink-secondary)] hover:bg-[var(--bg-kraft)]/75 hover:text-[var(--ink)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
