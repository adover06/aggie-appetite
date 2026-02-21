// Mock data based on API Contract (CLAUDE.md Section 4)
// Use these to build UI without a live backend.

// ── Types ──────────────────────────────────────────────

export interface IdentifiedItem {
  name: string;
  confidence: number;
  source: string;
}

export interface ScanResponse {
  session_id: string;
  identified_items: IdentifiedItem[];
  suggested_filters: string[];
}

export interface RecipeIngredient {
  name: string;
  status: "available" | "missing";
  substitution: string | null;
}

export interface Recipe {
  id: string;
  title: string;
  academic_fuel_score: number;
  fuel_summary: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
}

export interface RecipeResponse {
  recipes: Recipe[];
}

// ── Mock: POST /scan ───────────────────────────────────

export const mockScanResponse: ScanResponse = {
  session_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  identified_items: [
    { name: "Peanut Butter", confidence: 0.98, source: "ASUCD Pantry" },
    { name: "Rice", confidence: 0.95, source: "Pantry Staple" },
    { name: "Canned Black Beans", confidence: 0.92, source: "ASUCD Pantry" },
    { name: "Soy Sauce", confidence: 0.89, source: "Pantry Staple" },
    { name: "Oats", confidence: 0.88, source: "ASUCD Pantry" },
    { name: "Ramen Noodles", confidence: 0.94, source: "Pantry Staple" },
  ],
  suggested_filters: ["Vegetarian", "High Protein", "No-Cook", "Quick (<15 min)"],
};

// ── Mock: POST /generate-recipes ───────────────────────

export const mockRecipeResponse: RecipeResponse = {
  recipes: [
    {
      id: "recipe_001",
      title: "Aggie Pad Thai",
      academic_fuel_score: 8.5,
      fuel_summary: "High in healthy fats for long CS labs.",
      ingredients: [
        { name: "Peanut Butter", status: "available", substitution: null },
        { name: "Ramen Noodles", status: "available", substitution: null },
        { name: "Soy Sauce", status: "available", substitution: null },
        {
          name: "Egg",
          status: "missing",
          substitution: "1/4 cup Applesauce (Available in Pantry)",
        },
        {
          name: "Lime",
          status: "missing",
          substitution: "1 tbsp Vinegar (Available in Pantry)",
        },
      ],
      instructions: [
        "Boil ramen noodles according to package (discard seasoning packet).",
        "Mix 2 tbsp pantry peanut butter with 1 tbsp soy sauce and a splash of vinegar.",
        "Drain noodles and toss with the peanut sauce.",
        "Top with canned black beans for extra protein.",
      ],
    },
    {
      id: "recipe_002",
      title: "Brain-Boost Black Bean Bowl",
      academic_fuel_score: 9.2,
      fuel_summary: "Complex carbs + plant protein to power through midterms.",
      ingredients: [
        { name: "Rice", status: "available", substitution: null },
        { name: "Canned Black Beans", status: "available", substitution: null },
        { name: "Soy Sauce", status: "available", substitution: null },
        {
          name: "Avocado",
          status: "missing",
          substitution: "2 tbsp Peanut Butter (Available in Pantry)",
        },
      ],
      instructions: [
        "Cook rice according to package directions.",
        "Heat black beans in a small pot with a splash of soy sauce.",
        "Serve beans over rice and top with a spoonful of peanut butter for healthy fats.",
      ],
    },
    {
      id: "recipe_003",
      title: "Overnight Oat Fuel",
      academic_fuel_score: 7.8,
      fuel_summary: "Slow-release energy for early morning lectures.",
      ingredients: [
        { name: "Oats", status: "available", substitution: null },
        { name: "Peanut Butter", status: "available", substitution: null },
        {
          name: "Milk",
          status: "missing",
          substitution: "Water + 1 tbsp Peanut Butter (Available in Pantry)",
        },
        {
          name: "Banana",
          status: "missing",
          substitution: "2 tbsp Applesauce (Available in Pantry)",
        },
      ],
      instructions: [
        "Combine 1/2 cup oats with 1 cup water in a jar.",
        "Stir in 1 tbsp peanut butter and 2 tbsp applesauce.",
        "Refrigerate overnight.",
        "Grab and go before your 8am lecture.",
      ],
    },
  ],
};
