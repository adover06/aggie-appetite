"""
Generative Chef Agent: creates fully original recipes using AI.

Unlike the Planner agent which looks up recipes from Google Sheets,
this agent generates recipes from scratch using only available ingredients.
Uses Groq primary / Ollama fallback (same pattern as substitution_expert).
"""

import json
import re

from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage

from app.config import Settings
from app.tools.notion_pantry import query_pantry_inventory
from app.services.academic_fuel import calculate_academic_fuel_score
from app.schemas.recipes import (
    GenerateRecipesResponse,
    Recipe,
    RecipeIngredient,
)
from app.schemas.common import IngredientStatus


def _get_text_llm(settings: Settings):
    """Get the text LLM: Groq primary, Ollama fallback."""
    if settings.GROQ_API_KEY:
        from langchain_groq import ChatGroq
        print("[GenerativeChef] Using Groq cloud LLM (primary)")
        return ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model=settings.GROQ_MODEL,
            temperature=0.7,
        )
    print("[GenerativeChef] Using Ollama local LLM (no Groq key configured)")
    return ChatOllama(
        model=settings.OLLAMA_TEXT_MODEL,
        base_url=settings.OLLAMA_BASE_URL,
        temperature=0.7,
    )


def _build_prompt(
    ingredients: list[str],
    filters: list[str],
    dietary_preferences: list[str],
) -> str:
    """Build the recipe generation prompt."""
    constraints = []
    if filters:
        constraints.append(f"Meal filters: {', '.join(filters)}")
    if dietary_preferences:
        constraints.append(f"Dietary restrictions: {', '.join(dietary_preferences)}")

    constraints_text = "\n".join(constraints) if constraints else "No special constraints."

    return f"""You are an expert chef creating recipes for UC Davis students using pantry staples.
Generate 1-3 original, easy-to-make recipes using ONLY these available ingredients:

Available ingredients: {json.dumps(ingredients)}

{constraints_text}

IMPORTANT RULES:
- Use ONLY the ingredients listed above. Do not require any ingredient not in the list.
- Assume basic seasonings (salt, pepper, water) are always available.
- Keep recipes simple — most students have limited cooking equipment (microwave, stovetop, basic pots/pans).
- Each recipe should be completable in under 45 minutes.
- Make sure to only give the top most relevant recipes.
- If the ingredients are not enough to make a recipe, don't give one.

Return ONLY a JSON array of recipes in this exact format, no other text:
[
  {{
    "title": "Recipe Name",
    "ingredients": [
      {{"name": "Ingredient Name", "quantity": "amount"}},
    ],
    "instructions": [
      "Step 1...",
      "Step 2..."
    ]
  }}
]

Return ONLY the JSON array, no markdown fences, no explanation."""


def _parse_recipes_json(content: str) -> list[dict]:
    """Parse LLM response into recipe dicts, handling common formatting issues."""
    # Try direct parse
    try:
        data = json.loads(content)
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass

    # Try extracting JSON array from response
    match = re.search(r"\[.*\]", content, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group())
            if isinstance(data, list):
                return data
        except json.JSONDecodeError:
            pass

    return []


async def run_generative_chef(
    ingredients: list[str],
    filters: list[str],
    dietary_preferences: list[str],
    settings: Settings,
) -> GenerateRecipesResponse:
    """
    Generate fully original recipes using AI based on available ingredients.
    No spreadsheet lookup — purely LLM-generated.
    """
    # Step 1: Get pantry inventory to combine with scanned items
    try:
        pantry_json = await query_pantry_inventory.ainvoke({"category": ""})
        pantry_items_raw = json.loads(pantry_json)
        pantry_names = [item["name"] for item in pantry_items_raw]
    except Exception:
        pantry_names = []

    all_available = list(set(ingredients + pantry_names))
    print(f"[GenerativeChef] User items: {ingredients}")
    print(f"[GenerativeChef] Notion pantry items: {pantry_names}")
    print(f"[GenerativeChef] Combined available ({len(all_available)}): {all_available}")

    # Step 2: Build prompt and call LLM
    prompt = _build_prompt(all_available, filters, dietary_preferences)
    llm = _get_text_llm(settings)

    try:
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        print("[GenerativeChef] LLM call succeeded")
    except Exception as e:
        print(f"[GenerativeChef] Primary LLM failed: {e}")
        # Groq failed — try Ollama fallback
        if settings.GROQ_API_KEY and settings.OLLAMA_BASE_URL:
            print("[GenerativeChef] Falling back to Ollama local LLM...")
            fallback = ChatOllama(
                model=settings.OLLAMA_TEXT_MODEL,
                base_url=settings.OLLAMA_BASE_URL,
                temperature=0.7,
            )
            response = await fallback.ainvoke([HumanMessage(content=prompt)])
            print("[GenerativeChef] Ollama fallback succeeded")
        else:
            raise

    # Step 3: Parse response
    raw_recipes = _parse_recipes_json(response.content)
    if not raw_recipes:
        print(f"[GenerativeChef] Failed to parse LLM response: {response.content[:200]}")
        return GenerateRecipesResponse(recipes=[])

    # Step 4: Build Recipe objects with academic fuel scoring
    available_set = {item.strip().lower() for item in all_available}
    recipes = []
    for i, raw in enumerate(raw_recipes):
        recipe_ings = []
        ing_names = []

        for ing in raw.get("ingredients", []):
            name = ing.get("name", "") if isinstance(ing, dict) else str(ing)
            quantity = ing.get("quantity", "") if isinstance(ing, dict) else ""
            display_name = f"{quantity} {name}".strip() if quantity else name

            recipe_ings.append(RecipeIngredient(
                name=display_name,
                status=IngredientStatus.available,
                substitution=None,
            ))
            ing_names.append(name)

        # Academic fuel score
        score, summary = calculate_academic_fuel_score(ing_names)

        instructions = raw.get("instructions", [])
        if isinstance(instructions, str):
            instructions = [s.strip() for s in instructions.split("\n") if s.strip()]

        recipes.append(Recipe(
            id=f"ai_recipe_{i + 1:03d}",
            title=raw.get("title", "AI Chef Recipe"),
            academic_fuel_score=score,
            fuel_summary=summary,
            ingredients=recipe_ings,
            instructions=instructions,
        ))

    print(f"[GenerativeChef] Generated {len(recipes)} recipes")
    return GenerateRecipesResponse(recipes=recipes)
