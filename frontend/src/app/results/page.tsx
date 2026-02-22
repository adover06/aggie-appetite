"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { generateRecipes, generateAIRecipe } from "@/lib/api";
import { mockRecipeResponse } from "@/lib/mockData";
import { getUserProfile, saveAllergies } from "@/lib/user";
import { ItemList } from "@/components/ItemList";
import { FilterChips } from "@/components/FilterChips";
import { Button } from "@/components/ui/Button";
import { SkeletonItemList } from "@/components/ui/Skeleton";
import { useState, useEffect, useRef } from "react";

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
  const { uid, guest } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const allergiesLoaded = useRef(false);

  // Load saved allergies from Firestore for authenticated (non-guest) users
  useEffect(() => {
    if (allergiesLoaded.current || !uid || guest) return;
    allergiesLoaded.current = true;

    getUserProfile(uid)
      .then((profile) => {
        profile.allergies.forEach((allergy) => {
          if (DIETARY_OPTIONS.includes(allergy)) {
            toggleDietaryPreference(allergy);
          }
        });
      })
      .catch(() => {
        // Silently fail — user can still select manually
      });
  }, [uid, guest, toggleDietaryPreference]);

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

  const handleGenerate = async (mode: "database" | "ai" = "database") => {
    if (selectedItems.length === 0) return;
    setError(null);
    setIsGenerating(true);

    // Save selected dietary preferences to Firestore for logged-in users
    if (uid && !guest && dietaryPreferences.length > 0) {
      saveAllergies(uid, dietaryPreferences).catch(() => {});
    }

    const requestBody = {
      session_id: scanResult.session_id,
      identified_items: selectedItems.map((i) => i.name),
      filters: selectedFilters,
      dietary_preferences: dietaryPreferences,
    };

    try {
      let result;
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 2000));
        result = mockRecipeResponse;
      } else if (mode === "ai") {
        result = await generateAIRecipe(requestBody);
      } else {
        result = await generateRecipes(requestBody);
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
        <div className="mt-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Generate buttons */}
      <div className="mt-10 flex justify-center gap-4">
        <Button
          size="lg"
          onClick={() => handleGenerate("database")}
          disabled={selectedItems.length === 0 || isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generating...
            </>
          ) : (
            <>Generate Recipes ({selectedItems.length} items)</>
          )}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => handleGenerate("ai")}
          disabled={selectedItems.length === 0 || isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generating...
            </>
          ) : (
            <>AI Chef ({selectedItems.length} items)</>
          )}
        </Button>
      </div>
    </main>
  );
}
