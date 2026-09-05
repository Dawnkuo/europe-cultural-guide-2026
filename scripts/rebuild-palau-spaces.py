"""Inspect source-bounded room faces in the four COAM Palau drawings."""

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
SHA = "7b6ea6df723783a7b4e66fc6b3975f3e1154d066f09f4ceb02eafbb4e65431e3"
CUTS = {
    "plan-I": [],
    "plan-II": [
        ("north-wall-scan-gap", (508, 53), (540, 56)),
        ("stage-north-door", (660, 156), (675, 155)),
        ("stage-south-door", (666, 282), (684, 282)),
        ("stage-backstage-threshold", (667, 137), (687, 137)),
    ],
    "plan-III": [],
    "plan-IV": [("inset-west-column-line", (250, 181), (245, 292))],
}


def fill_internal_details(mask, walls):
    filled = np.zeros_like(mask)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(filled, contours, -1, 1, cv2.FILLED)
    return filled & (1 - walls)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    config = json.loads((ROOT / "sources/floorplans/venues/palau-musica.json").read_text())
    source = ROOT / "sources/floorplans" / config["file"]
    if hashlib.sha256(source.read_bytes()).hexdigest() != SHA:
        raise ValueError("Palau source changed")
    output = ROOT / "work/map-review/palau-source-faces"
    output.mkdir(parents=True, exist_ok=True)
    report = {"sourceSha256": SHA, "floors": {}, "method": "Source-ink bounded white components; source thresholds close selections only. Seating risers are not walls; the central upper void is excluded."}
    with fitz.open(source) as document:
        for floor in config["floors"]:
            page = document[floor["page"] - 1]
            pix = page.get_pixmap(matrix=fitz.Matrix(1, 1), colorspace=fitz.csRGB, alpha=False)
            rgb = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3).copy()
            if floor["id"] == "plan-IV":
                seat = next(p for p in floor["places"] if p["label"] == "历史上层座席区")
                seat["at"] = [330, 540]
                seat["evidence"] = "Anchor within the west upper seating band of COAM plan IV, outside the central auditorium void. The historic source provides no verified current access route."
            barrier = np.zeros(rgb.shape[:2], dtype=np.uint8)
            walls = np.zeros_like(barrier)
            for kind, _, geometry in BUILDER.raster_geometry(document, page, floor["rasterLayers"][0]):
                for polygon in BUILDER.polygons(geometry, [0, 0]):
                    for target in [barrier, walls] if kind == "wall" else [barrier]:
                        cv2.fillPoly(target, [np.rint(polygon["outer"]).astype(np.int32)], 1)
                        for hole in polygon["holes"]:
                            cv2.fillPoly(target, [np.rint(hole).astype(np.int32)], 0)
            # This 3-pixel closure is a selection barrier only. It cannot
            # change wall geometry, stair treads or building dimensions.
            barrier = cv2.morphologyEx(barrier, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
            for _, start, end in CUTS[floor["id"]]:
                cv2.line(barrier, start, end, 1, 2)
            count, labels, stats, _ = cv2.connectedComponentsWithStats(1 - barrier, connectivity=4)
            records = []
            spaces = []
            completed = {}
            name_counts = {}
            for index, place in enumerate(floor["places"]):
                x, y = map(round, place["at"])
                component = int(labels[y, x])
                if not component or stats[component, 4] >= pix.width * pix.height / 2:
                    raise ValueError(f"Unbounded/on-ink source selection {floor['id']} {place['label']}")
                component_ids = {component}
                upper_seats = place["label"] == "历史上层座席区"
                if upper_seats:
                    # Sample across the source's concentric seat strips. The
                    # samples select source faces, not a replacement outline.
                    for y0, x0, y1, x1 in [(500, 260, 500, 480), (540, 260, 540, 480), (420, 560, 453, 560), (589, 560, 620, 560), (441, 700, 610, 700), (460, 745, 588, 745)]:
                        samples = max(abs(x1 - x0), abs(y1 - y0)) + 1
                        for sx, sy in zip(np.linspace(x0, x1, samples).round().astype(int), np.linspace(y0, y1, samples).round().astype(int)):
                            component_ids.add(int(labels[sy, sx]))
                    excluded = {0, int(labels[520, 570]), int(labels[516, 805]), int(labels[432, 784]), int(labels[372, 537])}
                    component_ids -= excluded
                    for c in component_ids:
                        bx, by, bw, bh, _ = stats[c]
                        if bx < 235 or by < 400 or bx + bw > 820 or by + bh > 651:
                            raise ValueError(f"Seat selection escaped source ring: {c} {stats[c]}")
                mask = np.isin(labels, list(component_ids)).astype(np.uint8)
                if not upper_seats:
                    mask = fill_internal_details(mask, walls)
                geometry = BUILDER.trace_pixel_ink(mask, .1)
                if not geometry.covers(Point(place["at"])):
                    raise ValueError(f"Anchor outside traced floor face: {place['label']}")
                if upper_seats and geometry.covers(Point(570, 520)):
                    raise ValueError("Upper seating fills the auditorium void")
                name_counts[place["label"]] = name_counts.get(place["label"], 0) + 1
                place_id = f"{floor['id']}-{place['label']}-{name_counts[place['label']]}"
                record = {"label": place["label"], "components": sorted(component_ids), "componentSignatures": [stats[c].tolist() for c in sorted(component_ids)], "area": int(mask.sum()), "maskSha256": hashlib.sha256(mask.tobytes()).hexdigest()}
                records.append(record)
                key = record["maskSha256"]
                if key not in completed:
                    spaces.append({"id": f"source-face-{index + 1}", "label": place["label"], "placeId": place_id, "scope": "room", "polygons": BUILDER.polygons(geometry, [0, 0]), "sourcePaths": [f"image:{floor['rasterLayers'][0]['xref']}:reviewed-white-components"], "evidence": report["method"]})
                    completed[key] = spaces[-1]["id"]
                    color = np.array([(index * 73 + 30) % 255, (index * 47 + 80) % 255, (index * 139 + 140) % 255])
                    rgb[mask == 1] = (.6 * rgb[mask == 1] + .4 * color).astype(np.uint8)
                cv2.circle(rgb, (x, y), 4, (230, 45, 30), -1)
                cv2.putText(rgb, str(index), (x + 5, y - 5), cv2.FONT_HERSHEY_SIMPLEX, .4, (230, 45, 30), 1)
            floor["spaces"] = spaces
            floor["selectionCuts"] = [{"id": id_, "sourcePixelSegment": [start, end], "reason": "Source opening closure for face selection only; never a generated wall."} for id_, start, end in CUTS[floor["id"]]]
            Image.fromarray(rgb).save(output / f"{floor['id']}-components.png")
            cv2.imwrite(str(output / f"{floor['id']}-barrier.png"), barrier * 255)
            report["floors"][floor["id"]] = records
            print(floor["id"], len(spaces), [(r["label"], r["area"]) for r in records])
    (output / "proposal.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    if args.apply:
        manifest = ROOT / "sources/floorplans/rebuild-reports/palau-reviewed-source-faces.json"
        review = json.loads(manifest.read_text())
        if review.get("visualReview") is not True or review["floors"] != report["floors"] or review["sourceSha256"] != SHA:
            raise ValueError("Palau source-face review is missing or stale")
        (ROOT / "sources/floorplans/venues/palau-musica.json").write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
