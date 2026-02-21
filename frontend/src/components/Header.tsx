"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🥘</span>
          <span className="text-base font-semibold tracking-tight text-foreground">
            Scan, Swap, Sustain
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink href="/" active={pathname === "/"}>
            Scan
          </NavLink>
          <NavLink href="/results" active={pathname === "/results"}>
            Items
          </NavLink>
          <NavLink href="/recipes" active={pathname === "/recipes"}>
            Recipes
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary-light text-primary"
          : "text-muted hover:bg-stone-100 hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
