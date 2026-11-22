import io
import json

from google import genai
from google.genai import types

PROJECT_ID = "recovered-510021"
LOCATION = "global"
MODEL = "gemini-2.5-flash"


def identify_inventory_item(image):
    """Use Gemini to identify household items from a photo."""

    client = genai.Client(
        vertexai=True,
        project=PROJECT_ID,
        location=LOCATION,
    )

    image_bytes = io.BytesIO()
    image.save(image_bytes, format="JPEG")

    prompt = """
    You are a household inventory identification assistant.

    Identify the primary physical object in this image.

    RULES:
    - Describe only the primary object.
    - Ignore people, hands, background scenery, flooring,
    walls, and unrelated objects.
    - Describe visible physical characteristics such as
    material, color, design, and identifying markings.
    - Do not infer information that cannot be verified visually.
    - Identify the brand only when supported by visible markings.
    - Identify the model only when there is clear evidence.
    - Return null for unknown brands or models.
    - Do not estimate monetary value or purchase price.
    - Do not speculate about ownership, age, or condition.

    Choose the most appropriate category:
    - Electronics
    - Furniture
    - Jewelry
    - Appliance
    - Clothing
    - Footwear
    - Tools
    - Other

    Keep the description factual and concise.
    Use no more than 300 characters for the description.

    Return exactly one JSON object with these fields:

    {
        "item_name": "string",
        "category": "string",
        "brand": null,
        "model": null,
        "description": "string"
    }
    """

    response = client.models.generate_content(
        model=MODEL,
        contents=[
            prompt,
            types.Part.from_bytes(
                data=image_bytes.getvalue(),
                mime_type="image/jpeg",
            ),
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0,
        ),
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty response")

    return json.loads(response.text)
