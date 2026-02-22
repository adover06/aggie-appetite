"""
LangChain tool: search recipe database from Google Sheets.

Spreadsheet columns:
  - "Recipe"                       → recipe title
  - "Ingredients"                  → newline-separated full ingredient list
  - "Ingredient(s) at The Pantry"  → newline-separated pantry-available subset
  - "Preparation"                  → newline-separated cooking steps
"""

import json
import re
import asyncio

import gspread
from google.oauth2.service_account import Credentials
from langchain_core.tools import tool

from app.config import settings

SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]


def _get_sheet():
    creds = Credentials.from_service_account_file(
        settings.GOOGLE_SERVICE_ACCOUNT_JSON, scopes=SCOPES
    )
    gc = gspread.authorize(creds)
    return gc.open_by_key(settings.GOOGLE_SHEETS_RECIPE_SPREADSHEET_ID).sheet1


def _fetch_all_recipes() -> list[dict]:
    """Fetch all recipes from the spreadsheet (sync). Strip whitespace from keys."""
    sheet = _get_sheet()
    raw = sheet.get_all_records()
    # Strip whitespace from column headers (e.g. "Recipe " → "Recipe")
    return [{k.strip(): v for k, v in record.items()} for record in raw]


def _extract_ingredient_name(raw: str) -> str:
    """
    Strip quantities/measurements from an ingredient line to get the base name.
    e.g. '2 slices bacon, crispy and cut in strips' → 'bacon'
         '1 cup iceberg salad, shredded' → 'iceberg salad'
         '1 pouch Barilla Ready Pasta Elbows' → 'barilla ready pasta elbows'
    """
    cleaned = raw.strip()
    # Remove leading quantities
    cleaned = re.sub(r"^[\d½⅓¼¾⅔⅛/.×\-]+\s*", "", cleaned)
    # Remove unit words (whole words only)
    cleaned = re.sub(
        r"^(cups?|tbsps?|tsps?|oz|lbs?|cans?\s+of|pouche?s?|"
        r"slices?|leaves?|pieces?|cloves?|pinch|dash|"
        r"tablespoons?|teaspoons?|pounds?|ounces?|"
        r"large|medium|small|packed|fresh|dried|"
        r"ripe|chopped|diced|minced|grated|shredded|"
        r"crushed|ground|whole|thin|thick)\b\s*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )
    # Second pass for stacked adjectives
    cleaned = re.sub(
        r"^(large|medium|small|packed|fresh|dried|"
        r"ripe|chopped|diced|minced|grated|shredded|"
        r"crushed|ground|whole|thin|thick)\b\s*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )
    cleaned = re.sub(r"^of\s+", "", cleaned, flags=re.IGNORECASE)
    # Remove prep notes after comma
    cleaned = re.split(r",\s*", cleaned)[0]
    return cleaned.strip().lower()


def _parse_ingredient_lines(raw: str) -> list[str]:
    """Split newline-separated ingredient text into individual lines."""
    return [line.strip() for line in raw.strip().split("\n") if line.strip()]


def _search_recipes_sync(ingredients: list[str], max_results: int = 5) -> list[dict]:
    """Search recipes by ingredient match percentage."""
    all_recipes = _fetch_all_recipes()
    available = {i.strip().lower() for i in ingredients}

    scored = []
    for idx, recipe in enumerate(all_recipes):
        title = recipe.get("Recipe", "").strip()
        if not title:
            continue

        # Parse ingredient lines (newline-separated)
        raw_ingredients = str(recipe.get("Ingredients", ""))
        ingredient_lines = _parse_ingredient_lines(raw_ingredients)

        if not ingredient_lines:
            continue

        # Extract base ingredient names for matching
        ingredient_names = [_extract_ingredient_name(line) for line in ingredient_lines]

        # Match against available ingredients (fuzzy: check if user item appears in recipe item or vice versa)
        match_count = 0
        for recipe_ing in ingredient_names:
            for user_ing in available:
                if user_ing in recipe_ing or recipe_ing in user_ing:
                    match_count += 1
                    break

        match_pct = match_count / len(ingredient_names)

        # Pantry-available ingredients from the spreadsheet
        pantry_raw = str(recipe.get("Ingredient(s) at The Pantry", ""))
        pantry_lines = _parse_ingredient_lines(pantry_raw)

        # Preparation steps (newline-separated)
        prep_raw = str(recipe.get("Preparation", ""))
        prep_steps = _parse_ingredient_lines(prep_raw)

        scored.append({
            "id": f"recipe_{idx + 1:03d}",
            "title": title,
            "ingredients_raw": raw_ingredients,
            "ingredient_lines": ingredient_lines,
            "pantry_ingredients": pantry_lines,
            "instructions_raw": prep_raw,
            "instructions": prep_steps,
            "match_pct": round(match_pct, 2),
            "match_count": match_count,
            "total_ingredients": len(ingredient_names),
        })

    scored.sort(key=lambda x: x["match_pct"], reverse=True)
    return scored[:max_results]


@tool
async def query_recipe_database(ingredients: list[str], max_results: int = 5) -> str:
    """Search the recipe spreadsheet for recipes matching the given ingredients.
    Returns recipes sorted by how many ingredients match.
    Args:
        ingredients: list of available ingredient names
        max_results: max number of recipes to return (default 5)
    """
    results = await asyncio.to_thread(_search_recipes_sync, ingredients, max_results)
    return json.dumps(results)
