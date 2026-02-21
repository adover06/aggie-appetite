"use client";

import { useState } from "react";
import type { Recipe } from "@/lib/types";
import { ScoreBadge } from "./ui/ScoreBadge";
import { Badge } from "./ui/Badge";

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const [expanded, setExpanded] = useState(false);

  const availableCount = recipe.ingredients.filter(
    (i) => i.status === "available"
  ).length;
  const totalCount = recipe.ingredients.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-4 p-6 pb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">
            {recipe.title}
          </h3>
          <p className="mt-1 text-sm text-muted">{recipe.fuel_summary}</p>
        </div>
        <ScoreBadge score={recipe.academic_fuel_score} />
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
