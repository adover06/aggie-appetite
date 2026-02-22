from pydantic import BaseModel, Field
from .common import IngredientStatus


class RecipeIngredient(BaseModel):
    name: str
    status: IngredientStatus
    substitution: str | None = None


class Recipe(BaseModel):
    id: str
    title: str
    academic_fuel_score: float = Field(ge=1.0, le=10.0)
    fuel_summary: str
    ingredients: list[RecipeIngredient]
    instructions: list[str]


class GenerateRecipesRequest(BaseModel):
    session_id: str
    identified_items: list[str]
    filters: list[str] = []
    dietary_preferences: list[str] = []


class GenerateAIRecipeRequest(BaseModel):
    session_id: str
    identified_items: list[str]
    filters: list[str] = []
    dietary_preferences: list[str] = []


class GenerateRecipesResponse(BaseModel):
    recipes: list[Recipe]
