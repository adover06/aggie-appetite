import time


class PantryCache:
    """In-memory TTL cache for Notion pantry inventory."""

    def __init__(self, ttl_seconds: int = 300):
        self._cache: list[dict] | None = None
        self._last_fetch: float = 0
        self._ttl = ttl_seconds

    @property
    def is_stale(self) -> bool:
        return self._cache is None or (time.time() - self._last_fetch) > self._ttl

    async def get_items(self) -> list[dict]:
        if self.is_stale:
            from app.tools.notion_pantry import get_all_pantry_items
            self._cache = await get_all_pantry_items()
            self._last_fetch = time.time()
        return self._cache

    def get_item_names(self) -> set[str]:
        if self._cache is None:
            return set()
        return {item["name"].lower() for item in self._cache if item.get("available")}

    def invalidate(self):
        self._cache = None
