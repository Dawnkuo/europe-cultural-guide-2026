"""Review room selectors against the native St Peter plan, never add walls."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image
from shapely.geometry import Point

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("plans", ROOT / "scripts/build-architectural-plans.py")
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)

# Source doorway/column thresholds close masks for selection only. These
# segments are not emitted as wall, door, accessible route or floor links.
CUTS = {
    "basilica": [
        ("pieta-north-door", (330, 385), (354, 385)),
    ],
    "grottoes": [
        ("1-south-door", (409, 64), (429, 64)),
        ("2-diagonal-threshold", (304, 110), (324, 88)),
        ("4-diagonal-threshold", (525, 92), (538, 104)),
        ("7-east-door", (324, 176), (324, 205)),
        ("10-east-door", (325, 211), (325, 241)),
        ("10-north-door", (229, 170), (229, 213)),
        ("10-north-vestibule", (230, 209), (262, 209)),
        ("15-east-door", (322, 250), (322, 288)),
        ("17-south-door", (348, 290), (400, 290)),
        ("17-west-door", (345, 253), (345, 282)),
        ("19-south-door", (449, 289), (500, 289)),
        ("19-east-door", (500, 255), (500, 282)),
        ("19-west-door", (451, 249), (451, 276)),
        ("21-west-door", (535, 250), (535, 312)),
        ("24-diagonal-threshold", (530, 322), (543, 309)),
        ("43-west-door", (544, 480), (544, 509)),
        ("35-east-door", (161, 463), (161, 497)),
        ("35-south-door", (96, 505), (128, 505)),
        ("36-east-door", (257, 465), (257, 504)),
        ("37-south-door", (280, 506), (312, 506)),
        ("45-west-door", (77, 515), (77, 550)),
        ("45-east-door", (166, 516), (166, 550)),
        ("46-east-door", (253, 518), (253, 551)),
        ("47-east-door", (317, 521), (317, 550)),
    ],
}
KERNELS = {"basilica": {"6": 3}, "grottoes": {"1": 3, "2": 3, "4": 3, "7": 3, "9": 1, "10": 3, "14": 1, "15": 3, "17": 3, "19": 3, "21": 3, "24": 3, "35": 3, "36": 3, "37": 3, "43": 3, "45": 3, "46": 3, "47": 3}}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    config_path = ROOT / "sources/floorplans/venues/st-peters-basilica.json"
    config = json.loads(config_path.read_text())
    source = ROOT / "sources/floorplans/st-peters-reviewed-plans.pdf"
    output = ROOT / "work/map-review/st-peters-room-selections"
    output.mkdir(parents=True, exist_ok=True)
    report = {"sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(), "floors": {}}
    with fitz.open(source) as document, fitz.open(ROOT / "sources/floorplans/st-peters-churches-of-rome-127.pdf") as original:
        for floor in config["floors"]:
            floor_id = floor["id"]
            page = document[floor["page"] - 1]
            pix = fitz.Pixmap(document, page.get_images()[0][0])
            rgb = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, 3)
            walls = (rgb[:, :, 0] == 0).astype(np.uint8)
            ink = (rgb[:, :, 0] <= 128).astype(np.uint8)
            raw_pix = fitz.Pixmap(original, 99 if floor_id == "basilica" else 261)
            if raw_pix.colorspace != fitz.csRGB:
                raw_pix = fitz.Pixmap(fitz.csRGB, raw_pix)
            raw = np.frombuffer(raw_pix.samples, np.uint8).reshape(raw_pix.height, raw_pix.width, raw_pix.n)[:, :, :3].copy()
            if floor_id == "grottoes":
                gray = cv2.cvtColor(raw, cv2.COLOR_RGB2GRAY)
                red_labels = (raw[:, :, 0].astype(int) - raw[:, :, 1].astype(int) > 40)
                ink |= ((gray <= 175) & ~red_labels).astype(np.uint8)
                yy, xx = np.indices(ink.shape)
                for cx, cy in [(282, 73), (555, 71), (561, 348)]:
                    # Remove only the inner tread strokes from the selector;
                    # retain the native outer circular boundary and walls.
                    interior = (xx - cx) ** 2 + (yy - cy) ** 2 <= 15 ** 2
                    ink[interior] = walls[interior]
            selections, records, masks = [], [], []
            for place in floor["places"]:
                if place["label"] not in KERNELS[floor_id]:
                    continue
                kernel = KERNELS[floor_id][place["label"]]
                barrier = ink | cv2.morphologyEx(ink, cv2.MORPH_CLOSE, np.ones((kernel, kernel), np.uint8))
                for _, start, end in CUTS[floor_id]:
                    cv2.line(barrier, start, end, 1, 2)
                _, labels, stats, _ = cv2.connectedComponentsWithStats(1 - barrier, connectivity=4)
                x, y = map(round, place["at"])
                component = int(labels[y, x])
                record = {"label": place["label"], "kernel": kernel, "component": component, "signature": stats[component].tolist()}
                if component == 0 or stats[component, 4] > 15000:
                    record["unresolved"] = True
                    records.append(record)
                    continue
                mask = (labels == component).astype(np.uint8)
                # Fill only bounded detail/glyph islands, never source masonry.
                contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                cv2.drawContours(mask, contours, -1, 1, cv2.FILLED)
                mask &= 1 - walls
                shape = BUILDER.trace_pixel_ink(mask, .1)
                if not shape.covers(Point(place["at"])):
                    raise ValueError(f"Source label is outside room face: {floor_id} {place['label']}")
                record["maskSha256"] = hashlib.sha256(mask.tobytes()).hexdigest()
                record["area"] = int(mask.sum())
                records.append(record)
                selections.append({"id": f"source-room-{place['label']}", "label": place["name"], "placeId": f"{floor_id}-{place['label']}-1", "scope": "room", "selectionOnly": True, "polygons": BUILDER.polygons(shape, [0, 0]), "sourcePaths": [f"source-raster:{floor_id}:reviewed-room-thresholds"], "evidence": "Source-white face bounded by reviewed original linework and doorway-only selection closures; no new walls or visitor route is implied."})
                masks.append(mask)
                color = np.array([(len(masks) * 73 + 30) % 255, (len(masks) * 47 + 80) % 255, (len(masks) * 139 + 140) % 255])
                raw[mask == 1] = .55 * raw[mask == 1] + .45 * color
            for _, start, end in CUTS[floor_id]:
                cv2.line(raw, start, end, (210, 30, 230), 1)
            Image.fromarray(raw).save(output / f"{floor_id}-rooms.png")
            report["floors"][floor_id] = records
            floor["selectionSpaces"] = selections
            floor["selectionCuts"] = [{"id": id_, "sourcePixelSegment": [start, end], "reason": "Source threshold closes a selection only, never an emitted wall."} for id_, start, end in CUTS[floor_id]]
            print(floor_id, records)
    (output / "proposal.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    if args.apply:
        review = json.loads((ROOT / "sources/floorplans/rebuild-reports/st-peters-reviewed-room-selections.json").read_text())
        if review.get("visualReview") is not True or report["sourceSha256"] != review["sourceSha256"] or report["floors"] != review["floors"]:
            raise ValueError("St Peter room review is missing or stale")
        if any(r.get("unresolved") for records in report["floors"].values() for r in records):
            raise ValueError("Unreviewed room component")
        config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
