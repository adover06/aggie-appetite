"""
Scan, Swap, Sustain — FastAPI Backend
Entry point and API routing.
"""

import httpx
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.schemas.scan import ScanResponse, IdentifiedItem
from app.schemas.recipes import GenerateRecipesRequest, GenerateRecipesResponse
from app.tools.image_processor import analyze_pantry_image
from app.agents.planner import run_planner_agent
from app.services.pantry_cache import PantryCache

pantry_cache = PantryCache()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm pantry cache on startup if Notion is configured
    if settings.NOTION_API_KEY:
        try:
            await pantry_cache.get_items()
        except Exception:
            pass  # Don't block startup if Notion is unreachable
    yield


app = FastAPI(
    title="Scan, Swap, Sustain",
    description="Food equity backend for UC Davis students — ASUCD Pantry recipe engine",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Health ----------

@app.get("/health")
async def health_check():
    """Check API and Ollama connectivity."""
    ollama_ok = False
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=5)
            ollama_ok = resp.status_code == 200
    except Exception:
        pass

    return {
        "status": "ok",
        "ollama": "connected" if ollama_ok else "unreachable",
        "ollama_url": settings.OLLAMA_BASE_URL,
        "vision_model": settings.OLLAMA_VISION_MODEL,
        "text_model": settings.OLLAMA_TEXT_MODEL,
    }


# ---------- POST /scan ----------

SUGGESTED_FILTERS_MAP = {
    "protein": ["High Protein"],
    "peanut butter": ["High Protein", "Vegetarian"],
    "tofu": ["Vegetarian", "High Protein"],
    "beans": ["Vegetarian", "High Protein"],
    "lentils": ["Vegetarian", "High Protein"],
    "rice": ["Quick (<15 min)"],
    "noodles": ["Quick (<15 min)"],
    "pasta": ["Quick (<15 min)"],
    "oats": ["No-Cook", "Quick (<15 min)"],
    "bread": ["No-Cook"],
}


def _suggest_filters(item_names: list[str]) -> list[str]:
    """Rule-based filter suggestions from identified items."""
    filters = set()
    for name in item_names:
        key = name.strip().lower()
        if key in SUGGESTED_FILTERS_MAP:
            filters.update(SUGGESTED_FILTERS_MAP[key])
    if not filters:
        filters.add("Quick (<15 min)")
    return sorted(filters)


@app.post("/scan", response_model=ScanResponse)
async def scan_pantry(image: UploadFile = File(...)):
    """
    Upload a pantry image. Returns identified food items and suggested filters.
    This is the "Focus Moment" endpoint.
    """
    image_bytes = await image.read()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file")

    # Step 1: Vision model identifies items
    try:
        raw_items = await analyze_pantry_image(image_bytes, settings)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Vision model error: {str(e)}")

    # Step 2: Cross-reference with pantry cache
    pantry_names = pantry_cache.get_item_names()

    identified = []
    for item in raw_items:
        source = "ASUCD Pantry" if item["name"].lower() in pantry_names else "Personal"
        identified.append(IdentifiedItem(
            name=item["name"],
            confidence=item["confidence"],
            source=source,
        ))

    # Step 3: Suggest filters
    item_names = [item["name"] for item in raw_items]
    filters = _suggest_filters(item_names)

    return ScanResponse(
        session_id=str(uuid4()),
        identified_items=identified,
        suggested_filters=filters,
    )


# ---------- POST /generate-recipes ----------

@app.post("/generate-recipes", response_model=GenerateRecipesResponse)
async def generate_recipes(request: GenerateRecipesRequest):
    """
    Generate recipe recommendations with substitution engine and academic fuel scores.
    """
    if not request.identified_items:
        raise HTTPException(status_code=400, detail="No ingredients provided")

    try:
        result = await run_planner_agent(
            ingredients=request.identified_items,
            filters=request.filters,
            dietary_preferences=request.dietary_preferences,
            settings=settings,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Recipe generation error: {str(e)}")

    return result
