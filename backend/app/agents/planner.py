"""
Planner Agent: top-level orchestration for recipe generation.
Uses LangChain tool-calling agent with ChatOllama to decide when to call
the Recipe Database Tool vs the Substitution Tool.
"""

import json

from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.prebuilt import create_react_agent

from app.config import Settings
from app.tools.google_sheets_recipes import query_recipe_database
from app.tools.notion_pantry import query_pantry_inventory
from app.tools.substitution import run_substitution_check
from app.agents.substitution_expert import run_substitution_check as direct_substitution
from app.services.academic_fuel import calculate_academic_fuel_score
from app.schemas.recipes import (
    GenerateRecipesResponse,
    Recipe,
    RecipeIngredient,
)
from app.schemas.common import IngredientStatus

PLANNER_SYSTEM = """You are the Planner agent for Scan, Swap, Sustain — a food equity app
for UC Davis students. Given a list of available pantry ingredients and user preferences:

1. Call query_recipe_database to find recipes matching available ingredients.
2. For each recipe, call run_substitution_check to fill missing ingredients with pantry swaps.
3. Call query_pantry_inventory if you need the full current pantry stock.

Always work step by step and use the tools available to you."""


async def run_planner_agent(
    ingredients: list[str],
    filters: list[str],
    dietary_preferences: list[str],
    settings: Settings,
) -> GenerateRecipesResponse:
    """
    Orchestrate recipe generation.
    Uses the direct pipeline (more reliable for hackathon).
    Falls back gracefully on any error.
    """
    return await _direct_pipeline(ingredients, filters, dietary_preferences, settings)


async def _direct_pipeline(
    ingredients: list[str],
    filters: list[str],
    dietary_preferences: list[str],
    settings: Settings,
) -> GenerateRecipesResponse:
    """
    Direct pipeline: call tools sequentially without agent orchestration.
    More reliable for hackathon demo.
    """
    # Step 1: Get pantry inventory
    pantry_json = await query_pantry_inventory.ainvoke({"category": ""})
    try:
        pantry_items_raw = json.loads(pantry_json)
        pantry_names = [item["name"] for item in pantry_items_raw]
    except (json.JSONDecodeError, KeyError):
        pantry_names = ingredients  # fallback to user-provided items

    # Step 2: Search recipes
    all_available = list(set(ingredients + pantry_names))
    recipes_json = await query_recipe_database.ainvoke({
        "ingredients": all_available,
        "max_results": 5,
    })

    try:
        raw_recipes = json.loads(recipes_json)
    except json.JSONDecodeError:
        raw_recipes = []

    # Step 3: For each recipe, run substitution check + academic fuel scoring
    recipes = []
    for i, raw in enumerate(raw_recipes):
        # Ingredient lines are already parsed by the sheets tool
        recipe_ingredients = raw.get("ingredient_lines", [])
        if not recipe_ingredients:
            # Fallback: split newline-separated raw text
            recipe_ingredients = [
                line.strip()
                for line in raw.get("ingredients_raw", "").split("\n")
                if line.strip()
            ]

        # Run substitution expert
        sub_results = await direct_substitution(
            recipe_ingredients=recipe_ingredients,
            pantry_items=all_available,
            settings=settings,
        )

        # Build ingredient list
        recipe_ings = []
        for sub in sub_results:
            recipe_ings.append(RecipeIngredient(
                name=sub["name"],
                status=IngredientStatus(sub["status"]),
                substitution=sub.get("substitution"),
            ))

        # Academic fuel score
        ing_names = [sub["name"] for sub in sub_results]
        score, summary = calculate_academic_fuel_score(ing_names)

        # Instructions are already parsed by the sheets tool
        instructions = raw.get("instructions", [])
        if not instructions:
            instructions_raw = raw.get("instructions_raw", "")
            instructions = [
                s.strip() for s in instructions_raw.split("\n")
                if s.strip()
            ]

        recipes.append(Recipe(
            id=raw.get("id", f"recipe_{i + 1:03d}"),
            title=raw.get("title", "Untitled Recipe"),
            academic_fuel_score=score,
            fuel_summary=summary,
            ingredients=recipe_ings,
            instructions=instructions,
        ))

    return GenerateRecipesResponse(recipes=recipes)


