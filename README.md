# Aggie Appetite

---

- **Hackathon:** SacHacks 2026 (University of California, Davis)
- **Date:** February 21-22, 2026
- **Tracks:**
  - Best Technical Implementation
  - Best Design
  - Best Social Good

## About our project

- Aggie Appetite is a smart pantry recipe platform built for UC Davis students that bridges the gap between food access and food preparation.
- Users scan their pantry items using AI-powered image recognition, and the app cross-references them with the ASUCD Pantry inventory to identify what's available on campus.
- A Substitution Engine powered by LangChain agents suggests UC Davis pantry-specific ingredient swaps for missing items (e.g., Greek yogurt as a substitution for sour cream).
- Generates personalized recipes from the ASUCD Pantry recipe database or via an AI Chef, filtered by dietary preferences, allergies, and health goals.
- Supports user accounts with Firebase Authentication (Google Sign-In, email/password) for saving favorite recipes across sessions.

## Technologies used:

`Next.js` `TypeScript` `Tailwind CSS` `FastAPI` `LangChain` `LangGraph` `Groq` `Llama 3.1` `LLaVA` `YOLOv8` `Notion API` `Google Cloud Console` `Firebase Auth` `Firestore`

## How it works

1. **Scan** — Upload a photo of your pantry items. YOLOv8 + LLaVA vision models identify the ingredients and cross-reference them with the ASUCD Pantry database via Notion API.
2. **Swap** — Select your items, choose dietary preferences and quick filters. The LangChain-powered Substitution Engine checks for missing ingredients and suggests pantry-specific swaps.
3. **Save** — Browse generated recipes from the ASUCD Pantry recipe database or get original recipes from the AI Chef (Groq/Llama 3.1). Save your favorites to your account.

## Architecture

```
frontend/          Next.js 16 + TypeScript + Tailwind CSS v4
  src/app/         App Router pages (Scan, Items, Recipes, Favorites)
  src/components/  Reusable UI components
  src/context/     Auth + App state (React Context)
  src/lib/         API client, Firebase, types, mock data

backend/           FastAPI + LangChain + Python
  app/agents/      LangChain agents (Planner, Substitution Expert, Generative Chef)
  app/tools/       Custom tools (Notion, Google Sheets, Image Processing)
  app/schemas/     Pydantic request/response models
  app/services/    Pantry cache
```

## Future enhancements

- Real-time ASUCD Pantry inventory sync with push notifications when new items are stocked.
- Meal planning and grocery list generation based on weekly pantry availability.
- Community recipe sharing between UC Davis students.
- Expanded campus support beyond UC Davis to other university food pantries.

## Contributors

- Don Dang ( `donkimdang` )
- Andrew Dover ( `adover06` )
