from google.cloud import vision


def detect_objects_with_google(image_bytes: bytes) -> list[dict]:
    """Detect objects in an image using Google Cloud Vision."""

    client = vision.ImageAnnotatorClient()

    image = vision.Image(content=image_bytes)

    response = client.object_localization(image=image)

    if response.error.message:
        raise RuntimeError(
            f"Google Cloud Vision error: {response.error.message}"
        )

    objects = []

    for detected_object in response.localized_object_annotations:
        objects.append(
            {
                "name": detected_object.name,
                "confidence": float(detected_object.score),
                "bounding_box": [
                    {
                        "x": vertex.x,
                        "y": vertex.y,
                    }
                    for vertex in detected_object.bounding_poly.normalized_vertices
                ],
            }
        )

    return objects