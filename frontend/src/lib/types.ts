// --- /health ---

export interface HealthResponse {
  status: string;
  ollama: "connected" | "unreachable";
  ollama_url: string;
  vision_model: string;
  text_model: string;
}

// --- /scan ---

export interface IdentifiedItem {
  name: string;
  confidence: number;
  source: "ASUCD Pantry" | "Personal" | string;
}

export interface ScanResponse {
  session_id: string;
  identified_items: IdentifiedItem[];
  suggested_filters: string[];
}

// --- /generate-recipes ---

export interface GenerateRecipesRequest {
  session_id: string;
  identified_items: string[];
  filters?: string[];
  dietary_preferences?: string[];
}

export type IngredientStatus = "available" | "missing";

export interface RecipeIngredient {
  name: string;
  status: IngredientStatus;
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

export interface GenerateRecipesResponse {
  recipes: Recipe[];
}
