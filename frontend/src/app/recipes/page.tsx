"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { RecipeCard } from "@/components/RecipeCard";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";

export default function RecipesPage() {
  const router = useRouter();
  const { recipesResult, selectedItems, reset } = useApp();

  // No recipes — show empty state
  if (!recipesResult) {
    return (
      <main className="flex flex-col items-center pt-16 text-center">
        <span className="text-4xl">🍳</span>
        <h2 className="mt-4 text-xl font-semibold">No recipes yet</h2>
        <p className="mt-2 text-sm text-muted">
          Scan your pantry and generate recipes to see results here.
        </p>
        <Button className="mt-6" onClick={() => router.push("/")}>
          Start Scanning
        </Button>
      </main>
    );
  }

  const recipes = [...recipesResult.recipes].sort(
    (a, b) => b.academic_fuel_score - a.academic_fuel_score
  );

  return (
    <main>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Recipes</h1>
          <p className="mt-1 text-sm text-muted">
            {recipes.length} recipes from {selectedItems.length} ingredients.
            Sorted by Academic Fuel score.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            reset();
            router.push("/");
          }}
        >
          New Scan
        </Button>
      </div>

      {/* Recipe cards */}
      <div className="space-y-6">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-10 flex justify-center gap-3">
        <Button variant="secondary" onClick={() => router.push("/results")}>
          Edit Items & Filters
        </Button>
        <Button
          onClick={() => {
            reset();
            router.push("/");
          }}
        >
          Scan Again
        </Button>
      </div>
    </main>
  );
}
