#!/usr/bin/env python3
"""Validate Campanile output against independently reviewed source coordinates."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import fitz
import numpy as np
from shapely.geometry import Point, Polygon
from shapely.ops import unary_union


ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "sources/floorplans/venues/st-mark-campanile.json"
MODEL = ROOT / "app/data/architectural-plans/st-mark-campanile.json"
EVIDENCE = ROOT / "sources/floorplans/evidence/st-mark-campanile.json"
CHECKPOINTS = ROOT / "sources/floorplans/rebuild-reports/st-mark-campanile-source-checkpoints.json"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def feature_shape(feature):
    return unary_union(
        [Polygon(item["outer"], item.get("holes", [])) for item in feature["polygons"]]
    )


def main() -> None:
    config = json.loads(CONFIG.read_text())
    model = json.loads(MODEL.read_text())
    evidence = json.loads(EVIDENCE.read_text())
    checkpoints = json.loads(CHECKPOINTS.read_text())
    source_path = ROOT / "sources/floorplans" / config["file"]
    if sha256(source_path) != config["sha256"] or config["sha256"] != checkpoints["sha256"]:
        raise AssertionError("The 1912 source digest changed")
    if config["sourceProjection"] != evidence["projection"]:
        raise AssertionError("Projection evidence does not match the source config")

    document = fitz.open(source_path)
    page = document[checkpoints["page"] - 1]
    xref = checkpoints["imageXref"]
    pixmap = fitz.Pixmap(document, xref)
    if pixmap.colorspace != fitz.csRGB:
        pixmap = fitz.Pixmap(fitz.csRGB, pixmap)
    rgb = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(
        pixmap.height, pixmap.width, pixmap.n
    )[:, :, :3]
    matrix = page.get_image_rects(xref, transform=True)[0][1]
    inverse = ~matrix

    def source_window(source_point):
        normalized = fitz.Point(*source_point) * inverse
        x = min(pixmap.width - 1, max(0, round(normalized.x * pixmap.width)))
        y = min(pixmap.height - 1, max(0, round(normalized.y * pixmap.height)))
        return rgb[max(0, y - 1):min(pixmap.height, y + 2),
                   max(0, x - 1):min(pixmap.width, x + 2)]

    floor_specs = {item["id"]: item for item in config["floors"]}
    model_floors = {item["id"]: item for item in model["floors"]}
    failures = []
    counts = {"wall": 0, "detail": 0, "empty": 0}
    polygon_count = 0
    for checkpoint_floor in checkpoints["floors"]:
        floor_id = checkpoint_floor["id"]
        spec = floor_specs[floor_id]
        floor = model_floors[floor_id]
        if checkpoint_floor["crop"] != spec["crop"]:
            failures.append((floor_id, "crop-changed"))
        if floor.get("sourceId", "primary") != "primary":
            failures.append((floor_id, "non-1912-source-selected"))
        shapes = {"wall": [], "detail": []}
        for feature in floor["features"]:
            for item in feature["polygons"]:
                shape = Polygon(item["outer"], item.get("holes", []))
                if not shape.is_valid or shape.is_empty or shape.area <= 0:
                    failures.append((floor_id, "invalid-polygon", feature["id"]))
                polygon_count += 1
            if feature["kind"] in shapes:
                shapes[feature["kind"]].append(feature_shape(feature))
        unions = {kind: unary_union(items) for kind, items in shapes.items()}

        def local_point(source_point):
            return Point(
                source_point[0] - spec["crop"][0],
                source_point[1] - spec["crop"][1],
            )

        for key, expected in (
            ("requiredWall", "wall"),
            ("requiredDetail", "detail"),
            ("requiredEmpty", "empty"),
        ):
            for item in checkpoint_floor[key]:
                point = local_point(item["sourcePoint"])
                source_max = source_window(item["sourcePoint"]).max(axis=2)
                raw_ink = bool(np.any(source_max <= 150))
                raw_empty = bool(np.all(source_max > 150))
                in_wall = unions["wall"].covers(point)
                in_detail = unions["detail"].covers(point)
                if expected == "wall" and (not raw_ink or not in_wall):
                    failures.append((floor_id, item["id"], "missing-wall"))
                elif expected == "detail" and (not raw_ink or not in_detail or in_wall):
                    failures.append((floor_id, item["id"], "detail-misclassified"))
                elif expected == "empty" and (not raw_empty or in_wall or in_detail):
                    failures.append((floor_id, item["id"], "filled-source-opening"))
                counts[expected] += 1

    if failures:
        raise AssertionError(failures)

    if set(model_floors) != {"ground", "ramp", "bell-cell", "upper-service"}:
        raise AssertionError("The four-plan floor inventory changed")
    if len(model["places"]) != 8 or len(model["verticalLinks"]) != 3:
        raise AssertionError("Place or vertical-link coverage changed")
    place_fields = ("floorId", "label", "name", "kind", "at")
    actual_places = {
        item["id"]: {field: item[field] for field in place_fields}
        for item in model["places"]
    }
    expected_places = {}
    for spec in config["floors"]:
        label_counts = {}
        for anchor in spec["places"]:
            label = anchor["label"]
            label_counts[label] = label_counts.get(label, 0) + 1
            place_id = f"{spec['id']}-{label.replace(' ', '-')}-{label_counts[label]}"
            expected_places[place_id] = {
                "floorId": spec["id"],
                "label": anchor.get("displayLabel", label),
                "name": anchor.get("name", label),
                "kind": anchor.get("kind", "room"),
                "at": [
                    round(anchor["at"][0] - spec["crop"][0], 4),
                    round(anchor["at"][1] - spec["crop"][1], 4),
                ],
            }
    if actual_places != expected_places:
        raise AssertionError("A reviewed place anchor or public label changed")
    if model["stopBindings"] != [{"stopIndex": 0, "placeId": "ground-loggetta-1"}]:
        raise AssertionError("Route binding coverage changed")
    if any(link["kind"] not in {"stairs", "elevator"} for link in model["verticalLinks"]):
        raise AssertionError("Invalid vertical-link kind")
    if any(not any("\u3400" <= char <= "\u9fff" for char in item["label"])
           for item in [*model["places"], *model["verticalLinks"]]):
        raise AssertionError("A public manual marker or link lacks a Chinese label")
    if any(floor.get("sourceId") == "pre-collapse-1858" for floor in model["floors"]):
        raise AssertionError("The pre-collapse source was promoted to current geometry")
    expected_digests = {
        "primary": config["sha256"],
        "pre-collapse-1858": config["sourceFiles"][0]["sha256"],
    }
    if model.get("sourceDigests") != expected_digests:
        raise AssertionError("Source digest map changed")
    allowed_model_keys = {
        "version", "slug", "projection", "registration", "floors", "places",
        "limitations", "stopBindings", "sourceDigest", "sourceDigests",
        "verticalLinks", "spaces", "openings",
    }
    if set(model) - allowed_model_keys:
        raise AssertionError(f"Unsupported model properties: {set(model) - allowed_model_keys}")

    result = {
        "status": "pass",
        "sourcePage": checkpoints["page"],
        "floors": len(model["floors"]),
        "places": len(model["places"]),
        "verticalLinks": len(model["verticalLinks"]),
        "stopBindings": len(model["stopBindings"]),
        "wallCheckpoints": counts["wall"],
        "detailCheckpoints": counts["detail"],
        "emptyCheckpoints": counts["empty"],
        "features": sum(len(floor["features"]) for floor in model["floors"]),
        "polygons": polygon_count,
        "archivalSourceUsedByFloors": False,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
