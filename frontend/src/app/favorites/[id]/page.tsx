"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, toggleFavoriteRecipe } from "@/lib/user";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Recipe } from "@/lib/types";

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isLoggedIn, uid, loading: authLoading } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(true);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn || !uid) {
      setLoading(false);
      return;
    }

    getUserProfile(uid)
      .then((profile) => {
        const saved = profile.savedRecipes[id];
        if (saved) {
          setRecipe(saved);
          setFavorited(profile.favoriteRecipes.includes(id));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, isLoggedIn, uid, authLoading]);

  const handleToggleFavorite = async () => {
    if (!uid || !recipe || favLoading) return;
    setFavLoading(true);
    try {
      const nowFavorited = await toggleFavoriteRecipe(uid, recipe.id, recipe);
      setFavorited(nowFavorited);
    } catch {
      // Silently fail
    } finally {
      setFavLoading(false);
    }
  };

  if (loading) {
    return (
      <main>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-4 w-48" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="flex flex-col items-center pt-16 text-center">
        <span className="text-4xl">🔍</span>
        <h2 className="mt-4 text-xl font-semibold">Recipe not found</h2>
        <p className="mt-2 text-sm text-muted">
          This recipe may have been removed from your favorites.
        </p>
        <Button className="mt-6" onClick={() => router.push("/favorites")}>
          Back to Favorites
        </Button>
      </main>
    );
  }

  const availableCount = recipe.ingredients.filter((i) => i.status === "available").length;
  const missingCount = recipe.ingredients.length - availableCount;

  return (
    <main>
      {/* Back + header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/favorites")}
          className="mb-4 flex cursor-pointer items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to Favorites
        </button>

        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{recipe.title}</h1>
          <button
            onClick={handleToggleFavorite}
            disabled={favLoading}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-primary-light disabled:opacity-50"
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          >
            {favorited ? (
              <svg className="h-5 w-5 text-danger" viewBox="0 0 24 24" fill="currentColor">
                <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-muted" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            )}
          </button>
        </div>

        {/* Summary line */}
        <div className="mt-2 flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-success" />
            {availableCount} available
          </span>
          {missingCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-accent" />
              {missingCount} need swap
            </span>
          )}
          <span>{recipe.ingredients.length} ingredients</span>
          <span>{recipe.instructions.length} steps</span>
        </div>
      </div>

      {/* Ingredients */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          Ingredients
        </h2>
        <div className="space-y-3">
          {recipe.ingredients.map((ing) => (
            <div key={ing.name} className="flex items-start gap-2">
              {ing.status === "available" ? (
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              )}
              <div className="flex-1">
                <span className={`text-sm ${ing.status === "missing" ? "text-muted line-through" : "text-foreground"}`}>
                  {ing.name}
                </span>
                {ing.substitution && (
                  <div className="mt-0.5">
                    <Badge variant="warning">{ing.substitution}</Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Instructions */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          Instructions
        </h2>
        <ol className="space-y-4">
          {recipe.instructions.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span className="pt-0.5 text-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
