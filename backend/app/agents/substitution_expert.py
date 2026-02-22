"""
Substitution Expert: checks missing ingredients and suggests pantry-specific swaps.

Uses a hardcoded substitution table for accuracy, with LLM fallback for edge cases.
"""

import json
import re

from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage

from app.config import Settings

# Hardcoded cooking substitution table.
# Key = missing ingredient (lowercase), Value = (substitution description, category hint)
# These are real, tested cooking substitutions.
SUBSTITUTION_TABLE: dict[str, str] = {
    # Eggs & Binders
    "egg": "1/4 cup Applesauce",
    "eggs": "1/2 cup Applesauce",
    "hard-boiled egg": "1/4 cup mashed Black Beans",
    "hard-boiled eggs": "1/2 cup mashed Black Beans",
    # Dairy
    "butter": "equal amount Coconut Oil or Olive Oil",
    "milk": "equal amount Water + 1 tbsp Peanut Butter (blended)",
    "half and half": "equal amount Milk (if available) or Water + Oil",
    "cream": "Coconut Milk or blended Oats + Water",
    "yogurt": "equal amount Applesauce",
    "sour cream": "equal amount Applesauce",
    "cheese": "Nutritional Yeast (if available) or omit",
    "parmigiano-reggiano cheese": "omit or use any available cheese",
    "parmesan cheese": "omit or use any available cheese",
    "blue cheese": "omit or use any available cheese",
    "cotija": "Parmesan Cheese or omit",
    # Proteins
    "bacon": "omit (add Oil for fat + Salt for flavor)",
    "chicken": "canned Tuna or Black Beans",
    "chicken breast": "canned Tuna or Black Beans",
    "grilled chicken breast": "canned Tuna or Black Beans",
    "pork": "canned Tuna or Black Beans",
    "pork chops": "canned Tuna or Black Beans",
    "pork loin blade chops": "canned Tuna or Black Beans",
    "tuna": "Black Beans or Chickpeas",
    "canned tuna": "Black Beans or Chickpeas",
    "ground beef": "Black Beans or Lentils",
    # Produce
    "avocado": "omit or add extra Oil for creaminess",
    "lemon": "1 tbsp Vinegar",
    "lemon juice": "1 tbsp Vinegar",
    "lime": "1 tbsp Vinegar",
    "lime juice": "1 tbsp Vinegar",
    "lemon or lime": "1 tbsp Vinegar",
    "fresh ginger": "1/4 tsp ground Ginger (dried spice) or omit",
    "ginger": "1/4 tsp ground Ginger (dried spice) or omit",
    "fresh basil": "1/2 tsp dried Basil or omit",
    "basil": "1/2 tsp dried Basil or omit",
    "cilantro": "omit or use dried Parsley",
    "green onions": "diced Onion",
    "scallions": "diced Onion",
    "tomatoes": "canned Tomato Soup or canned Tomatoes",
    "plum tomatoes": "canned Tomatoes or Tomato Soup",
    "iceberg salad": "Spinach or any available greens",
    "lettuce": "Spinach or any available greens",
    "spinach": "any available greens or omit",
    "cucumber": "omit or use Carrot",
    # Condiments & Sauces
    "mayonnaise": "mashed Avocado or Yogurt (if available)",
    "ranch dressing": "Oil + Vinegar + Salt",
    "alfredo sauce": "Oil + Salt + Water (thin white sauce)",
    "tomato sauce": "canned Tomato Soup",
    "soy sauce": "Salt + Water (1 tsp salt per tbsp soy sauce)",
    "hot sauce": "Red Pepper Flakes or omit",
    "sriracha": "Red Pepper Flakes or omit",
    "vinegar": "Lemon Juice or Lime Juice",
    "sesame oil": "Olive Oil or any available Oil",
    "vegetable oil": "Olive Oil or any available Oil",
    "oil": "Olive Oil or Coconut Oil",
    "cooking spray": "Oil",
    # Grains & Carbs
    "rice": "Pasta or Noodles",
    "pasta": "Rice or Noodles",
    "noodles": "Pasta or Rice",
    "bread": "Tortilla or Crackers",
    "tortilla": "Bread or flatbread",
    "breadcrumbs": "crushed Crackers or crushed dry Oats",
    # Sweeteners
    "sugar": "Honey or Maple Syrup",
    "honey": "Sugar (equal amount)",
    "maple syrup": "Honey or Sugar",
    "brown sugar": "white Sugar + tiny bit of Honey",
    # Nuts
    "peanuts": "any available Nuts or Seeds",
    "cashews": "Peanuts or any available Nuts",
    "almonds": "Peanuts or any available Nuts",
    "peanut butter": "any Nut Butter or Tahini",
    # Misc
    "coconut milk": "blended Oats + Water",
    "broth": "Water + Salt + Oil",
    "chicken broth": "Water + Salt + Oil",
    "vegetable broth": "Water + Salt + Oil",
    "cornstarch": "Flour (use 2x the amount)",
    "flour": "blended Oats",
}


def _normalize_ingredient(raw: str) -> str:
    """Strip quantities, units, and prep notes to get the base ingredient name."""
    cleaned = raw.strip()

    # Remove leading quantities (numbers, fractions, ranges)
    cleaned = re.sub(r"^[\d½⅓¼¾⅔⅛/.×\-]+\s*", "", cleaned)

    # Remove unit words (only as whole words to avoid eating "canned" → "ned")
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

    # Run again to catch stacked adjectives (e.g., "2 large ripe")
    cleaned = re.sub(
        r"^(large|medium|small|packed|fresh|dried|"
        r"ripe|chopped|diced|minced|grated|shredded|"
        r"crushed|ground|whole|thin|thick)\b\s*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )

    # Remove "of " prefix (e.g., "of Parmesan cheese")
    cleaned = re.sub(r"^of\s+", "", cleaned, flags=re.IGNORECASE)

    # Remove prep notes after comma (e.g., ", shredded")
    cleaned = re.split(r",\s*", cleaned)[0]

    return cleaned.strip().lower()


def _is_available(ingredient: str, pantry_set: set[str]) -> bool:
    """Check if an ingredient is available in the pantry (fuzzy match)."""
    norm = _normalize_ingredient(ingredient)
    # Direct match
    if norm in pantry_set:
        return True
    # Check if any pantry item contains the ingredient or vice versa
    for pantry_item in pantry_set:
        if norm in pantry_item or pantry_item in norm:
            return True
    return False


def _find_substitution(ingredient: str) -> str | None:
    """Look up a substitution from the hardcoded table."""
    norm = _normalize_ingredient(ingredient)

    # Direct match
    if norm in SUBSTITUTION_TABLE:
        return SUBSTITUTION_TABLE[norm]

    # Partial match — check if any table key is contained in the ingredient
    for key, sub in SUBSTITUTION_TABLE.items():
        if key in norm or norm in key:
            return sub

    return None


async def run_substitution_check(
    recipe_ingredients: list[str],
    pantry_items: list[str],
    settings: Settings,
) -> list[dict]:
    """
    Check each recipe ingredient against pantry, suggest substitutions for missing ones.

    Uses the hardcoded table first, LLM fallback for unknowns.
    """
    pantry_set = {p.strip().lower() for p in pantry_items}
    results = []
    llm_needed = []

    for ing in recipe_ingredients:
        if _is_available(ing, pantry_set):
            results.append({
                "name": ing,
                "status": "available",
                "substitution": None,
            })
        else:
            sub = _find_substitution(ing)
            if sub is not None:
                results.append({
                    "name": ing,
                    "status": "missing",
                    "substitution": sub,
                })
            else:
                # Queue for LLM fallback
                llm_needed.append(ing)
                results.append({
                    "name": ing,
                    "status": "missing",
                    "substitution": None,  # placeholder
                })

    # LLM fallback for items not in the table
    if llm_needed and settings.OLLAMA_BASE_URL:
        try:
            llm_subs = await _llm_substitution(llm_needed, pantry_items, settings)
            # Merge LLM results back
            for r in results:
                if r["substitution"] is None and r["status"] == "missing":
                    norm = _normalize_ingredient(r["name"])
                    if norm in llm_subs and llm_subs[norm]:
                        r["substitution"] = llm_subs[norm]
        except Exception:
            pass  # If LLM fails, items just have no substitution

    return results


async def _llm_substitution(
    missing_items: list[str],
    pantry_items: list[str],
    settings: Settings,
) -> dict[str, str | None]:
    """Ask the LLM for substitutions for items not in the hardcoded table."""
    llm = ChatOllama(
        model=settings.OLLAMA_TEXT_MODEL,
        base_url=settings.OLLAMA_BASE_URL,
        temperature=0,
    )

    prompt = f"""You are a cooking substitution expert. For each missing ingredient below,
suggest a practical cooking substitution using ONLY items from the available pantry list.
If no reasonable substitution exists, respond with null.

Missing ingredients: {json.dumps(missing_items)}
Available pantry items: {json.dumps(pantry_items)}

Return ONLY a JSON object mapping each missing ingredient to its substitution string or null.
Example: {{"ginger": "1/4 tsp dried ginger", "saffron": null}}
Return ONLY the JSON object, no other text."""

    response = await llm.ainvoke([HumanMessage(content=prompt)])

    try:
        data = json.loads(response.content)
        if isinstance(data, dict):
            return {k.lower(): v for k, v in data.items()}
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", response.content, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group())
                if isinstance(data, dict):
                    return {k.lower(): v for k, v in data.items()}
            except json.JSONDecodeError:
                pass

    return {}
