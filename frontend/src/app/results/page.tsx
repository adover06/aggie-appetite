"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { generateRecipes } from "@/lib/api";
import { mockRecipeResponse } from "@/lib/mockData";
import { ItemList } from "@/components/ItemList";
import { FilterChips } from "@/components/FilterChips";
import { Button } from "@/components/ui/Button";
import { SkeletonItemList } from "@/components/ui/Skeleton";
import { useState } from "react";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

const DIETARY_OPTIONS = [
  "No Dairy",
  "Gluten Free",
  "Nut Free",
  "Vegan",
  "Halal",
];

export default function ResultsPage() {
  const router = useRouter();
  const {
    scanResult,
    selectedItems,
    selectedFilters,
    dietaryPreferences,
    isGenerating,
    toggleItem,
    removeItem,
    addCustomItem,
    toggleFilter,
    toggleDietaryPreference,
    setRecipesResult,
    setIsGenerating,
  } = useApp();
  const [error, setError] = useState<string | null>(null);

  // No scan data — redirect to home
  if (!scanResult) {
    return (
      <main className="flex flex-col items-center pt-16 text-center">
        <span className="text-4xl">📷</span>
        <h2 className="mt-4 text-xl font-semibold">No scan results yet</h2>
        <p className="mt-2 text-sm text-muted">
          Scan your pantry first to see identified items.
        </p>
        <Button className="mt-6" onClick={() => router.push("/")}>
          Go to Scanner
        </Button>
      </main>
    );
  }

  const handleGenerate = async () => {
    if (selectedItems.length === 0) return;
    setError(null);
    setIsGenerating(true);

    try {
      let result;
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 2000));
        result = mockRecipeResponse;
      } else {
        result = await generateRecipes({
          session_id: scanResult.session_id,
          identified_items: selectedItems.map((i) => i.name),
          filters: selectedFilters,
          dietary_preferences: dietaryPreferences,
        });
      }
      setRecipesResult(result);
      router.push("/recipes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recipe generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Review Your Items
        </h1>
        <p className="mt-1 text-sm text-muted">
          {selectedItems.length} of {scanResult.identified_items.length} items
          selected. Add, remove, or deselect items before generating recipes.
        </p>
      </div>

      {/* Items */}
      {isGenerating ? (
        <SkeletonItemList />
      ) : (
        <ItemList
          items={scanResult.identified_items}
          selectedItems={selectedItems}
          onToggle={toggleItem}
          onRemove={removeItem}
          onAddCustom={addCustomItem}
        />
      )}

      {/* Filters */}
      <div className="mt-8 space-y-6">
        {scanResult.suggested_filters.length > 0 && (
          <FilterChips
            label="Quick Filters"
            options={scanResult.suggested_filters}
            selected={selectedFilters}
            onToggle={toggleFilter}
          />
        )}

        <FilterChips
          label="Dietary Preferences"
          options={DIETARY_OPTIONS}
          selected={dietaryPreferences}
          onToggle={toggleDietaryPreference}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Generate button */}
      <div className="mt-10 flex justify-center">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={selectedItems.length === 0 || isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generating Recipes...
            </>
          ) : (
            <>
              🧠 Generate Recipes ({selectedItems.length} items)
            </>
          )}
        </Button>
      </div>
    </main>
  );
}
