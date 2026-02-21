SYSTEM ROLE: You are an Elite Backend Architect specializing in FastAPI, LangChain, and Agentic Workflows. Your goal is to build the backend for "Scan, Swap, Sustain," a food equity app for UC Davis students.

OBJECTIVE: Build a production-ready FastAPI backend that processes pantry images, queries a recipe spreadsheet, and uses an AI "Substitution Engine" to suggest meals based on available ingredients.

TECH STACK:

Framework: FastAPI

Orchestration: LangChain (Agentic workflow for tool calling)

Data Sources: Notion API (Pantry status), Google Sheets (Scraped Recipes), Image Uploads (Vision-enabled LLM).

Core Logic: "Substitution Engine" and "Academic Fuel" scoring.

PROJECT REPOSITORY STRUCTURE:

/app/main.py - Entry point and API routing.

/app/agents/ - LangChain agent definitions (Planner, Substitution Expert).

/app/tools/ - Custom tools for Notion, Google Sheets, and Image Processing.

/app/schemas/ - Pydantic models for request/response (JSON structure).

/app/services/ - Logic for "Academic Fuel" scoring.

SPECIFIC TASK INSTRUCTIONS:

Agentic Workflow: Use a LangChain agent to decide when to call the "Substitution Tool" vs. the "Recipe Database Tool."

The Substitution Engine: This tool must logic-check missing ingredients and suggest UC Davis pantry-specific swaps (e.g., apple sauce for eggs).

Academic Fuel Logic: Create a service that calculates a 1-10 "Brain Power" score based on protein, Omega-3s, and complex carbs.

Data Scraping: Provide a modular function to ingest the pantry spreadsheet data.

No Frontend: Focus strictly on the API endpoints and JSON responses.

DELIVERABLES:

Full Python code for the FastAPI structure.

Implementation of the LangChain Agent and Tools.

Detailed JSON Schemas for every endpoint so the Frontend Architect can begin integration immediately.

JSON Schemas for Coordination
To help you coordinate with your frontend architect right now, here are the core schemas that Claude will generate based on the prompt above.

1. Image Upload & Analysis (/scan)
This is the "Focus Moment" response.

JSON
{
  "session_id": "uuid-string",
  "identified_items": [
    {"name": "Peanut Butter", "confidence": 0.98, "source": "ASUCD Pantry"},
    {"name": "Rice", "confidence": 0.95, "source": "Pantry Staple"}
  ],
  "suggested_filters": ["Vegetarian", "High Protein", "Quick (<15 min)"]
}
2. Recipe Recommendations (/generate-recipes)
This includes the Substitution Engine and Academic Fuel score.

JSON
{
  "recipes": [
    {
      "id": "recipe_001",
      "title": "Aggie Pad Thai",
      "academic_fuel_score": 8.5,
      "fuel_summary": "High in healthy fats for long CS labs.",
      "ingredients": [
        {"name": "Peanut Butter", "status": "available"},
        {"name": "Noodles", "status": "available"},
        {
          "name": "Egg", 
          "status": "missing",
          "substitution": "1/4 cup Applesauce (Available in Pantry)"
        }
      ],
      "instructions": ["Boil noodles...", "Mix pantry peanut butter with soy sauce..."]
    }
  ]
}