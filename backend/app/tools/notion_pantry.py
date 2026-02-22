"""
LangChain tool: query ASUCD Pantry inventory from Notion.

Uses httpx directly with Notion-Version 2022-06-28 because the
notion-client SDK v2.7+ uses the 2025-09-03 API which broke databases.query.
"""

import json
import httpx
from langchain_core.tools import tool

from app.config import settings

NOTION_API_BASE = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.NOTION_API_KEY}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }


async def _query_database(db_id: str, filter_body: dict | None = None) -> list[dict]:
    """Query a single Notion database and return parsed items."""
    body = filter_body or {}
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{NOTION_API_BASE}/databases/{db_id}/query",
            headers=_headers(),
            json=body,
        )
    if resp.status_code != 200:
        return []

    data = resp.json()
    items = []
    for page in data.get("results", []):
        props = page["properties"]
        try:
            name = props["Name"]["title"][0]["plain_text"]
        except (KeyError, IndexError):
            continue

        cat = props.get("Category", {}).get("select", {})
        category = cat.get("name", "Unknown") if cat else "Unknown"

        # Availability can be "status" or "select" depending on API version
        avail_prop = props.get("Availability", {})
        avail_type = avail_prop.get("type", "")
        if avail_type == "status":
            avail_name = avail_prop.get("status", {}).get("name", "")
        elif avail_type == "select":
            sel = avail_prop.get("select")
            avail_name = sel.get("name", "") if sel else ""
        else:
            avail_name = ""

        is_available = avail_name.lower() == "in stock"

        items.append({
            "name": name.strip(),
            "category": category,
            "available": is_available,
        })

    return items


async def _find_child_databases(page_id: str) -> list[str]:
    """Find all child_database block IDs inside a Notion page."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{NOTION_API_BASE}/blocks/{page_id}/children?page_size=100",
            headers=_headers(),
        )
    if resp.status_code != 200:
        return []
    blocks = resp.json().get("results", [])
    return [b["id"] for b in blocks if b["type"] == "child_database"]


async def get_all_pantry_items() -> list[dict]:
    """
    Query all child databases under the ASUCD Pantry page
    and return a merged, deduplicated list of available items.
    """
    if not settings.NOTION_API_KEY or not settings.NOTION_PANTRY_DATABASE_ID:
        return []

    page_id = settings.NOTION_PANTRY_DATABASE_ID
    db_ids = await _find_child_databases(page_id)

    all_items = []
    for db_id in db_ids:
        items = await _query_database(db_id)
        all_items.extend(items)

    # Deduplicate by name (keep the first occurrence with availability info)
    seen = {}
    for item in all_items:
        key = item["name"].lower()
        if key not in seen:
            seen[key] = item
        elif item["available"] and not seen[key]["available"]:
            seen[key] = item  # prefer "In stock" version

    return list(seen.values())


@tool
async def query_pantry_inventory(category: str = "") -> str:
    """Query the ASUCD Pantry Notion database for currently available items.
    Optionally filter by category (e.g., 'Produce', 'Canned/Jarred Foods', 'Dry/Baking Goods').
    Returns a JSON list of available pantry items."""

    all_items = await get_all_pantry_items()

    # Filter to available items
    available = [i for i in all_items if i["available"]]

    # Optional category filter
    if category:
        available = [
            i for i in available
            if i["category"].lower() == category.lower()
        ]

    return json.dumps(available)
