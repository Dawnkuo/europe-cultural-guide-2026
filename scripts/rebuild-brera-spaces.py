"""Derive selection faces from Brera's source walls and reviewed door gaps."""
import hashlib
import importlib.util
import json
from pathlib import Path

import cv2
import fitz
import numpy as np
from shapely.affinity import affine_transform
from shapely.geometry import Point

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("plans", ROOT / "scripts/build-architectural-plans.py")
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)

# Only selection masks close these visibly printed doorway gaps. No new wall
# geometry or public navigation links are created from these review segments.
CUTS = [
    ("11-neck", [[226.5, 77.5], [263, 77.5]]),
    ("8-10", [[195, 95.5], [208, 95.5]]),
    ("10-12", [[401.2, 82], [401.2, 93]]),
    ("12-13", [[428, 83], [428, 93]]),
    ("12-15", [[408, 95.5], [420, 95.5]]),
    ("8-9", [[237.3, 111], [237.3, 149]]),
    ("9-14", [[309.3, 111], [309.3, 149]]),
    ("14-15", [[375.6, 111], [375.6, 149]]),
    ("8-west-service", [[174, 161.8], [186, 161.8]]),
    ("8-7", [[212, 161.8], [224, 161.8]]),
    ("7-6", [[237.3, 168], [237.3, 181]]),
    ("14-1", [[334, 161.8], [349, 161.8]]),
    ("15-18", [[396, 161.8], [407, 161.8]]),
    ("1-18", [[354.2, 168], [354.2, 179]]),
    ("19-west-service", [[354.2, 197], [354.2, 209]]),
    ("1-5", [[307, 185.8], [325, 185.8]]),
    ("5-4", [[307, 204.4], [325, 204.4]]),
    ("3-4-east", [[328.5, 210], [328.5, 223]]),
    ("3-4", [[307, 220.2], [325, 220.2]]),
    ("north-gallery-hall", [[329, 225.5], [354.5, 225.5]]),
    ("3-2", [[307, 233.2], [325, 233.2]]),
    ("1A-east", [[329, 251], [329, 294]]),
    ("18-20", [[454.8, 186], [454.8, 199]]),
    ("18-19", [[390.5, 169], [390.5, 181]]),
    ("18-hall", [[394, 237], [410, 237]]),
    ("20-21", [[479, 192], [479, 201]]),
    ("21-22", [[518, 191], [518, 201]]),
    ("22-23", [[560, 224], [560, 237]]),
    ("23-24", [[591, 236.7], [603, 236.7]]),
    ("22-courtyard", [[543, 237], [554, 237]]),
    ("24-courtyard", [[560, 241], [560, 251]]),
    ("24-27", [[590, 280.8], [603, 280.8]]),
    ("27-28-west", [[568, 304.7], [579, 304.7]]),
    ("27-28-east", [[593, 304.7], [603, 304.7]]),
    ("28-courtyard", [[560, 330], [560, 341]]),
    ("28-29-west", [[565, 361.8], [578, 361.8]]),
    ("28-29-east", [[588, 361.8], [602, 361.8]]),
    ("29-30", [[575, 385.8], [590, 385.8]]),
    ("30-31", [[574, 411], [590, 411]]),
    ("31-34", [[560, 435], [560, 451]]),
    ("31-32", [[590, 462], [602, 462]]),
    ("31-33", [[567, 462], [578, 462]]),
    ("34-33", [[560, 461], [560, 477]]),
    ("32-33", [[586.3, 466], [586.3, 472]]),
    ("34-corridor", [[523.3, 449], [523.3, 464]]),
    ("35-corridor", [[486, 463], [520, 463]]),
    ("36-corridor", [[486, 449.3], [520, 449.3]]),
    ("37-corridor", [[482.2, 449], [482.2, 464]]),
    ("37-38-north", [[439.7, 429], [439.7, 438]]),
    ("37-38-south", [[439.7, 474], [439.7, 484]]),
    ("38-cafe", [[391.3, 427], [391.3, 438]]),
    ("38-courtyard", [[395, 425.5], [410, 425.5]]),
    ("34-courtyard", [[545, 425.5], [556, 425.5]]),
]


def main():
    config = json.loads((ROOT / "sources/floorplans/venues/brera.json").read_text())
    source = ROOT / "sources/floorplans" / config["file"]
    assert hashlib.sha256(source.read_bytes()).hexdigest() == config["sha256"]
    floor = config["floors"][0]
    spec = floor["rasterLayers"][0]
    with fitz.open(source) as document:
        pixmap = fitz.Pixmap(document, spec["xref"])
        if pixmap.colorspace != fitz.csRGB:
            pixmap = fitz.Pixmap(fitz.csRGB, pixmap)
        rgb = np.frombuffer(pixmap.samples, np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)[:, :, :3]
        low, high = spec["rgbRange"]
        ink = np.all((rgb >= low) & (rgb <= high), axis=2).astype(np.uint8)
        matrix = document[1].get_image_rects(spec["xref"], transform=True)[0][1]
        inverse = ~matrix

        def pixel(point):
            p = fitz.Point(point) * inverse
            return round(p.x * pixmap.width), round(p.y * pixmap.height)

        for item in spec["excludeRects"]:
            x0, y0 = pixel(item["rect"][:2])
            x1, y1 = pixel(item["rect"][2:])
            ink[y0:y1, x0:x1] = 0
        yy, xx = np.where(ink == 1)
        source_pixels = np.column_stack([xx, yy])
        snapped = []
        for name, segment in CUTS:
            ends = []
            distances = []
            for end in segment:
                guess = np.array(pixel(end))
                delta = source_pixels - guess
                nearest = int(np.argmin(np.sum(delta * delta, axis=1)))
                distances.append(float(np.linalg.norm(delta[nearest])))
                ends.append(tuple(source_pixels[nearest]))
            if max(distances) > 14:
                raise ValueError(f"Unreviewed opening endpoint {name}: {distances}")
            snapped.append((name, ends))
            cv2.line(ink, *ends, 1, 1)
        _, components, stats, _ = cv2.connectedComponentsWithStats(1 - ink, connectivity=4)
        grouped = {}
        for place in floor["places"]:
            x, y = pixel(place["at"])
            component = int(components[y, x])
            grouped.setdefault(component, []).append(place["label"])
        if len(grouped) != 34 or sorted(labels for labels in grouped.values() if len(labels) > 1) != [["1", "6"]]:
            raise ValueError(f"Room separation changed: {grouped}")
        transform = [matrix.a / pixmap.width, matrix.c / pixmap.height,
                     matrix.b / pixmap.width, matrix.d / pixmap.height, matrix.e, matrix.f]
        spaces, claims = [], []
        for component, labels in grouped.items():
            x, y, width, height, area = stats[component]
            if not component or not x or not y or x + width == pixmap.width or y + height == pixmap.height:
                raise ValueError(f"Unbounded selection face: {labels}")
            geometry = affine_transform(BUILDER.trace_pixel_ink((components == component).astype(np.uint8), tolerance=.2), transform)
            for label in labels:
                place = next(p for p in floor["places"] if p["label"] == label)
                if not geometry.covers(Point(place["at"])):
                    raise ValueError(f"Source label outside selection face: {label}")
            primary = "6" if labels == ["1", "6"] else labels[0]
            spaces.append({
                "id": "room-" + "-".join(labels), "label": "、".join(labels) + " 号展区",
                "placeId": f"gallery-{primary}-1", "scope": "room",
                "polygons": BUILDER.polygons(geometry, [0, 0]), "sourcePaths": [f"image:27:reviewed-floor-component:{component}"],
                "evidence": "Connected source-white face bounded by the published structural ink and individually reviewed doorway selection cuts. Cuts close floor selection only; they are not extruded walls or access permissions. Labels 1 and 6 share the continuous source gallery and are not divided by an invented partition.",
            })
            claims.append({"labels": labels, "component": component, "pixelArea": int(area), "sourceArea": geometry.area,
                           "sourceBounds": list(geometry.bounds), "holes": sum(len(p["holes"]) for p in spaces[-1]["polygons"])})
        floor["spaces"] = spaces
        (ROOT / "sources/floorplans/venues/brera.json").write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")
        report = {"sourceHash": config["sha256"], "page": 2, "imageXref": 27,
                  "method": "Native source pixels, no morphology; exact reviewed door gaps close selection faces, not walls.",
                  "roomLabels": floor["expectedLabels"], "spaces": claims,
                  "cuts": [{"id": name, "sourcePixelSegment": [list(map(int, p)) for p in ends]} for name, ends in snapped]}
        (ROOT / "sources/floorplans/rebuild-reports/brera-source-spaces.json").write_text(json.dumps(report, indent=2) + "\n")
        print(json.dumps(claims, ensure_ascii=False))
        image = rgb.copy()
        image[rgb.max(axis=2) < 30] = 255
        for index, (component, labels) in enumerate(grouped.items()):
            mask = components == component
            color = np.array([(index * 67 + 30) % 200, (index * 131 + 30) % 200, (index * 31 + 30) % 200])
            image[mask] = image[mask] * .5 + color * .5
        for _, segment in snapped:
            cv2.line(image, *segment, (255, 0, 0), 2)
        cv2.imwrite("/tmp/brera-selection-review.png", cv2.cvtColor(image, cv2.COLOR_RGB2BGR))


if __name__ == "__main__":
    main()
