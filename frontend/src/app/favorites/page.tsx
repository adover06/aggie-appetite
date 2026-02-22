"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getFavoriteRecipes, toggleFavoriteRecipe } from "@/lib/user";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Recipe } from "@/lib/types";

export default function FavoritesPage() {
  const router = useRouter();
  const { isLoggedIn, uid, loading: authLoading } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn || !uid) {
      setLoading(false);
      return;
    }

    getFavoriteRecipes(uid)
      .then((favs) => setRecipes(favs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn, uid, authLoading]);

  const handleUnfavorite = async (recipe: Recipe) => {
    if (!uid || togglingId) return;
    setTogglingId(recipe.id);
    try {
      await toggleFavoriteRecipe(uid, recipe.id, recipe);
      setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
    } catch {
      // Silently fail
    } finally {
      setTogglingId(null);
    }
  };

  // Not logged in
  if (!authLoading && !isLoggedIn) {
    return (
      <main className="flex flex-col items-center pt-16 text-center">
        <svg className="h-12 w-12 text-muted" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
        <h2 className="mt-4 text-xl font-semibold">Sign in to save favorites</h2>
        <p className="mt-2 text-sm text-muted">
          Create an account to save your favorite recipes and access them anytime.
        </p>
        <Button className="mt-6" onClick={() => router.push("/")}>
          Sign In
        </Button>
      </main>
    );
  }

  // Loading
  if (loading) {
    return (
      <main>
        <h1 className="text-2xl font-bold tracking-tight">Your Favorites</h1>
        <p className="mt-1 text-sm text-muted">Loading your saved recipes...</p>
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </main>
    );
  }

  // No favorites
  if (recipes.length === 0) {
    return (
      <main className="flex flex-col items-center pt-16 text-center">
        <svg className="h-12 w-12 text-muted" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
        <h2 className="mt-4 text-xl font-semibold">No favorites yet</h2>
        <p className="mt-2 text-sm text-muted">
          Generate recipes and tap the heart to save your favorites here.
        </p>
        <Button className="mt-6" onClick={() => router.push("/")}>
          Start Scanning
        </Button>
      </main>
    );
  }

  return (
    <main>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Your Favorites</h1>
        <p className="mt-1 text-sm text-muted">
          {recipes.length} saved recipe{recipes.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-3">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
          >
            {/* Clickable title area — links to detail page */}
            <Link
              href={`/favorites/${recipe.id}`}
              className="flex flex-1 items-center gap-3 p-4"
            >
              <svg className="h-5 w-5 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              <span className="text-sm font-medium text-foreground">
                {recipe.title}
              </span>
              <span className="ml-auto flex items-center gap-1 rounded-lg bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
                View Recipe
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </span>
            </Link>

            {/* Heart button */}
            <button
              onClick={() => handleUnfavorite(recipe)}
              disabled={togglingId === recipe.id}
              className="mr-4 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-primary-light disabled:opacity-50"
              aria-label="Remove from favorites"
            >
              <svg className="h-5 w-5 text-danger" viewBox="0 0 24 24" fill="currentColor">
                <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
