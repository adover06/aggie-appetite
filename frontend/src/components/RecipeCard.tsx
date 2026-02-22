"use client";

import { useState } from "react";
import type { Recipe } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { toggleFavoriteRecipe } from "@/lib/user";
import { Badge } from "./ui/Badge";

interface RecipeCardProps {
  recipe: Recipe;
  initialFavorited?: boolean;
  onFavoriteChange?: (recipeId: string, isFavorited: boolean) => void;
}

export function RecipeCard({
  recipe,
  initialFavorited = false,
  onFavoriteChange,
}: RecipeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [favLoading, setFavLoading] = useState(false);
  const { isLoggedIn, uid } = useAuth();

  const availableCount = recipe.ingredients.filter(
    (i) => i.status === "available"
  ).length;
  const totalCount = recipe.ingredients.length;

  const handleToggleFavorite = async () => {
    if (!uid || favLoading) return;
    setFavLoading(true);
    try {
      const nowFavorited = await toggleFavoriteRecipe(uid, recipe.id, recipe);
      setFavorited(nowFavorited);
      onFavoriteChange?.(recipe.id, nowFavorited);
    } catch {
      // Silently fail
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-4 p-6 pb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">
            {recipe.title}
          </h3>
        </div>
        {/* Favorite button — only for logged-in (non-guest) users */}
        {isLoggedIn && (
          <button
            onClick={handleToggleFavorite}
            disabled={favLoading}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-primary-light disabled:opacity-50"
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
        )}
      </div>

      {/* Ingredient summary */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-success" />
            {availableCount} available
          </span>
          {totalCount - availableCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-accent" />
              {totalCount - availableCount} need swap
            </span>
          )}
        </div>
      </div>

      {/* Ingredients */}
      <div className="border-t border-border px-6 py-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          Ingredients
        </p>
        <div className="space-y-2">
          {recipe.ingredients.map((ing) => (
            <div key={ing.name} className="flex items-start gap-2">
              {ing.status === "available" ? (
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              ) : (
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                  />
                </svg>
              )}
              <div className="flex-1">
                <span
                  className={`text-sm ${ing.status === "missing" ? "text-muted line-through" : "text-foreground"}`}
                >
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
      </div>

      {/* Instructions (expandable) */}
      <div className="border-t border-border">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full cursor-pointer items-center justify-between px-6 py-3 text-sm font-medium text-primary hover:bg-primary-light/30"
        >
          <span>
            {expanded ? "Hide" : "Show"} Instructions ({recipe.instructions.length}{" "}
            steps)
          </span>
          <svg
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>

        {expanded && (
          <div className="border-t border-border px-6 py-4">
            <ol className="space-y-3">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
