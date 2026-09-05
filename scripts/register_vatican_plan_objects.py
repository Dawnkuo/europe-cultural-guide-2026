#!/usr/bin/env python3
"""Create independently registered Vatican Museums plan-object pages.

The official visitor map stores each plan as a single rotated CMYK image.  The
page placement has a very small non-uniform scale.  This helper rotates native
pixels clockwise, restores one equal x/y scale about the official placement
centre, and emits one source object per PDF page so floors cannot inherit plan
context from another object.
"""
from __future__ import annotations

import hashlib
import io
import json
from pathlib import Path

import fitz
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "sources/floorplans"
OFFICIAL = SOURCE / "vatican-museums-candidate-1.pdf"
OUTPUT = SOURCE / "vatican-museums-registered-plans.pdf"
QA = ROOT / "work/vatican-semantic-qa"
EXPECTED_SOURCE_SHA256 = "a0c97704c9af1b096f9e9fa12061acd6998f112206af01c24b7cfda7dbf6c9ff"

OBJECTS = [
    {"id": "first", "sourcePage": 1, "sourceXref": 115, "nativeSize": [940, 1667]},
    {"id": "second", "sourcePage": 2, "sourceXref": 17, "nativeSize": [583, 1074]},
    {"id": "basement", "sourcePage": 2, "sourceXref": 15, "nativeSize": [473, 679]},
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rounded_rect(rect: fitz.Rect) -> list[float]:
    return [round(value, 6) for value in rect]


def main() -> None:
    if sha256(OFFICIAL) != EXPECTED_SOURCE_SHA256:
        raise ValueError("Official Vatican map changed; registration review required")

    source = fitz.open(OFFICIAL)
    output = fitz.open()
    records = []
    QA.mkdir(parents=True, exist_ok=True)

    for page_number, record in enumerate(OBJECTS, start=1):
        source_page = source[record["sourcePage"] - 1]
        placements = source_page.get_image_rects(record["sourceXref"], transform=True)
        if not placements:
            raise ValueError(f"Missing Vatican plan object {record['id']}")
        source_rect, source_matrix = placements[0]
        extracted = source.extract_image(record["sourceXref"])
        image = Image.open(io.BytesIO(extracted["image"])).convert("RGB")
        if list(image.size) != record["nativeSize"]:
            raise ValueError(f"Native size changed for Vatican plan object {record['id']}")

        rotated = image.transpose(Image.Transpose.ROTATE_270)
        scale = min(source_rect.width / rotated.width, source_rect.height / rotated.height)
        width = rotated.width * scale
        height = rotated.height * scale
        target = fitz.Rect(
            source_rect.x0 + (source_rect.width - width) / 2,
            source_rect.y0 + (source_rect.height - height) / 2,
            source_rect.x0 + (source_rect.width + width) / 2,
            source_rect.y0 + (source_rect.height + height) / 2,
        )

        buffer = io.BytesIO()
        rotated.save(buffer, format="PNG")
        output_page = output.new_page(width=source_page.rect.width, height=source_page.rect.height)
        output_page.insert_image(target, stream=buffer.getvalue(), keep_proportion=False)
        rotated.save(QA / f"{record['id']}-native-clockwise.png")

        records.append({
            **record,
            "registeredPage": page_number,
            "pageSize": [round(source_page.rect.width, 6), round(source_page.rect.height, 6)],
            "sourcePlacementRect": rounded_rect(source_rect),
            "sourcePlacementMatrix": [round(value, 6) for value in source_matrix],
            "rotation": "90-degrees-clockwise",
            "axisOrientation": {
                "registeredPositiveX": "source-native-negative-Y",
                "registeredPositiveY": "source-native-positive-X",
            },
            "registeredNativeSize": list(rotated.size),
            "registeredTargetRect": rounded_rect(target),
            "registeredUnitsPerPixel": round(scale, 9),
            "registrationMethod": "uniform-scale-about-official-placement-centre-no-warp",
        })

    output.save(OUTPUT, deflate=True, no_new_id=True)
    output.close()
    source.close()

    manifest = {
        "source": str(OFFICIAL),
        "sourceSha256": EXPECTED_SOURCE_SHA256,
        "output": str(OUTPUT),
        "outputSha256": sha256(OUTPUT),
        "objects": records,
    }
    (QA / "registration.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    )
    print(OUTPUT)
    print(QA / "registration.json")


if __name__ == "__main__":
    main()
