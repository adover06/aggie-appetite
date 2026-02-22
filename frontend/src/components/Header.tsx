"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, isLoggedIn, displayName, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🥘</span>
          <span className="text-base font-semibold tracking-tight text-foreground">
            Aggie Appetite
          </span>
        </Link>

        <div className="flex items-center gap-1">
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
            {isLoggedIn && (
              <NavLink href="/favorites" active={pathname === "/favorites"}>
                Favorites
              </NavLink>
            )}
          </nav>

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="ml-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              )}
            </button>
          )}

          {/* Auth status */}
          {isAuthenticated && (
            <div className="ml-2 flex items-center gap-2">
              <span className="hidden text-xs text-muted sm:inline">
                {displayName}
              </span>
              <button
                onClick={() => signOut()}
                className="cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-primary-light hover:text-foreground"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
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
          : "text-muted hover:bg-primary-light/50 hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
