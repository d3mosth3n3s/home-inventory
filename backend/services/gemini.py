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
    Analyze this household inventory photo.

    Identify the main household item visible.

    Return these fields:
    - item_name
    - category
    - brand
    - model
    - description

    Only identify brands or models when there is
    sufficient visual evidence.

    If the brand or model cannot be determined,
    return an empty string for that field.

    Do not estimate a price.

    Return only a JSON object.
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