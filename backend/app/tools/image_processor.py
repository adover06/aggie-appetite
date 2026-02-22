"""
Vision tool: analyze pantry images.

Primary: YOLOv8 for instant object detection (~0.2s on CPU)
Fallback: llava via Ollama for items YOLO can't detect (packaged goods, etc.)
"""

import base64
import io
import json
import re

from PIL import Image
from ultralytics import YOLO
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage

from app.config import Settings

MAX_IMAGE_SIZE = 1024

# COCO classes that are food-related
FOOD_CLASSES = {
    "banana", "apple", "sandwich", "orange", "broccoli",
    "carrot", "hot dog", "pizza", "donut", "cake",
    "bottle", "wine glass", "cup", "fork", "knife",
    "spoon", "bowl",
}

# Map YOLO generic labels to better pantry names (None = skip)
LABEL_MAP = {
    "bottle": "Bottled Item",
    "cup": "Cup/Mug",
    "bowl": "Bowl",
    "wine glass": "Glass",
    "fork": None,
    "knife": None,
    "spoon": None,
}

# Load YOLO model once at module level
_yolo_model = None


def _get_yolo() -> YOLO:
    global _yolo_model
    if _yolo_model is None:
        _yolo_model = YOLO("yolov8n.pt")
    return _yolo_model


def _compress_image(image_bytes: bytes) -> Image.Image:
    """Open and resize image."""
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode in ("RGBA", "P", "LA"):
        img = img.convert("RGB")
    w, h = img.size
    if max(w, h) > MAX_IMAGE_SIZE:
        ratio = MAX_IMAGE_SIZE / max(w, h)
        img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
    return img


def _image_to_b64(img: Image.Image) -> str:
    """Convert PIL image to base64 JPEG string."""
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=75)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


async def analyze_pantry_image(image_bytes: bytes, settings: Settings) -> list[dict]:
    """
    Identify food items in a pantry image.

    Always runs llava for accurate identification (compressed image for speed).
    YOLO runs in parallel as a fast supplement — its results are merged in.
    """
    img = _compress_image(image_bytes)

    # Run YOLO instantly for whatever it can detect
    yolo_items = _run_yolo(img)

    # Always run llava for full identification (it's far more accurate)
    try:
        llava_items = await _run_llava(img, settings)
    except Exception:
        llava_items = []

    # Merge: llava is primary, YOLO fills gaps
    seen = set()
    merged = []
    for item in llava_items:
        key = item["name"].lower()
        if key not in seen:
            merged.append(item)
            seen.add(key)
    for item in yolo_items:
        key = item["name"].lower()
        if key not in seen:
            merged.append(item)
            seen.add(key)

    return merged


def _run_yolo(img: Image.Image) -> list[dict]:
    """Run YOLOv8 on the image and return food items."""
    model = _get_yolo()
    results = model(img, conf=0.3, verbose=False)

    items = []
    seen = set()
    for r in results:
        for box in r.boxes:
            label = r.names[int(box.cls)]
            conf = round(float(box.conf), 2)

            # Skip non-food items
            if label not in FOOD_CLASSES:
                continue

            # Apply label mapping
            mapped = LABEL_MAP.get(label, label)
            if mapped is None:
                continue

            # Capitalize properly
            display_name = mapped.title()

            # Deduplicate (don't list "Banana" 4 times)
            if display_name.lower() in seen:
                continue
            seen.add(display_name.lower())

            items.append({
                "name": display_name,
                "confidence": conf,
            })

    return items


async def _run_llava(img: Image.Image, settings: Settings) -> list[dict]:
    """Fallback: use llava for detailed food identification."""
    llm = ChatOllama(
        model=settings.OLLAMA_VISION_MODEL,
        base_url=settings.OLLAMA_BASE_URL,
        temperature=0,
    )

    image_b64 = _image_to_b64(img)

    message = HumanMessage(
        content=[
            {
                "type": "text",
                "text": (
                    "You are a food identification assistant. Identify ALL food items "
                    "visible in this pantry/grocery image. Return ONLY a JSON array of "
                    "objects, each with 'name' (string, the food item) and 'confidence' "
                    "(float 0-1, how confident you are). Example:\n"
                    '[{"name": "Peanut Butter", "confidence": 0.95}]\n'
                    "Return ONLY the JSON array, no other text."
                ),
            },
            {
                "type": "image_url",
                "image_url": f"data:image/jpeg;base64,{image_b64}",
            },
        ]
    )

    response = await llm.ainvoke([message])
    return _parse_items_response(response.content)


def _parse_items_response(content: str) -> list[dict]:
    """Parse LLM response into a list of identified items."""
    try:
        items = json.loads(content)
        if isinstance(items, list):
            return _validate_items(items)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\[.*\]", content, re.DOTALL)
    if match:
        try:
            items = json.loads(match.group())
            if isinstance(items, list):
                return _validate_items(items)
        except json.JSONDecodeError:
            pass

    return []


def _validate_items(items: list) -> list[dict]:
    """Ensure each item has name and confidence fields."""
    validated = []
    for item in items:
        if isinstance(item, dict) and "name" in item:
            validated.append({
                "name": str(item["name"]),
                "confidence": float(item.get("confidence", 0.7)),
            })
    return validated
