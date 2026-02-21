import type {
  HealthResponse,
  ScanResponse,
  GenerateRecipesRequest,
  GenerateRecipesResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Backend unreachable");
  return res.json();
}

export async function scanImage(file: File): Promise<ScanResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_BASE}/scan`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const status = res.status;
    if (status === 400) throw new Error("Empty image file");
    if (status === 502) throw new Error("Vision model unreachable");
    throw new Error(`Scan failed (${status})`);
  }

  return res.json();
}

export async function generateRecipes(
  request: GenerateRecipesRequest
): Promise<GenerateRecipesResponse> {
  const res = await fetch(`${API_BASE}/generate-recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const status = res.status;
    if (status === 400) throw new Error("No ingredients provided");
    if (status === 502) throw new Error("Recipe engine unreachable");
    throw new Error(`Recipe generation failed (${status})`);
  }

  return res.json();
}
