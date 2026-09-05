"""Select museum floor faces bounded by the published wall contours."""
import hashlib
import importlib.util
import json
from pathlib import Path

import fitz
from shapely import set_precision, union_all
from shapely.geometry import LineString, Point
from shapely.ops import polygonize, unary_union

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("architectural_builder", ROOT / "scripts/build-architectural-plans.py")
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)

# These close reviewed openings for floor selection only, never wall geometry.
# Each endpoint lies on the source contour after its existing 0.05-unit join.
CUTS = [
    ("entrance", [[54.9, 533.95], [83.55, 535.05]]),
    ("room-1-side", [[178.05, 493.1], [178.05, 509.85]]),
    ("rooms-1-2-left", [[53.05, 405], [72.25, 405]]),
    ("rooms-1-2-right", [[143.85, 405], [161.1, 405]]),
    ("rooms-2-3-left", [[53.05, 329], [72.25, 329]]),
    ("rooms-2-3-right", [[143.85, 329], [161.1, 329]]),
    ("rooms-3-4-left", [[53.05, 217], [72.25, 217]]),
    ("rooms-3-4-right", [[141.55, 212.75], [161.1, 212.75]]),
    ("rooms-4-5-left", [[53.05, 134], [72.25, 132]]),
    ("rooms-4-5-right", [[142.2, 123.7], [162.65, 121.35]]),
    ("rooms-5-6", [[164.2, 80.85], [166.95, 100.4]]),
    ("rooms-6-7", [[233.3, 72.45], [236.75, 92.35]]),
    ("rooms-7-8-north", [[279.7, 65.45], [282.35, 84.3]]),
    ("rooms-7-8-south", [[286.95, 122.95], [289.85, 142.75]]),
    ("room-6-stair", [[180.6, 114.4], [225.85, 108.8]]),
    ("room-7-corridor", [[253.6, 163], [275.45, 160.5]]),
]


def main():
    path = ROOT / "sources/floorplans/extraction.json"
    configs = json.loads(path.read_text())
    config = next(c for c in configs if c["slug"] == "la-scala")
    source = ROOT / "sources/floorplans" / config["file"]
    assert hashlib.sha256(source.read_bytes()).hexdigest() == config["sha256"]
    doc = fitz.open(source)
    drawings = doc[1].get_drawings()
    lines = [set_precision(LineString(ring), .05) for i in range(145) for ring in BUILDER.subpaths(drawings[i])]
    network = unary_union(lines)
    from shapely.ops import nearest_points
    cuts = []
    for name, ends in CUTS:
        points = []
        for end in ends:
            point = Point(end)
            if network.distance(point) > .1:
                raise ValueError(f"Opening endpoint is not on its source wall: {name} {end}, {network.distance(point)}")
            points.append(nearest_points(point, network)[1].coords[0])
        cuts.append((name, LineString(points)))
    faces = list(polygonize(union_all([network, *(line for _, line in cuts)], grid_size=.001)))
    floor = config["floors"][0]
    spaces = []
    report = {"sourceHash": config["sha256"], "sourcePage": 2, "scope": "Selectable museum floor faces; opening cuts are not extruded walls or navigation paths.", "cuts": [{"id": n, "segment": list(g.coords)} for n, g in cuts], "rooms": []}
    for place in floor["places"]:
        matches = [f for f in faces if f.contains(Point(place["at"]))]
        if len(matches) != 1:
            raise ValueError(f"Expected one closed source face for Sala {place['label']}, got {len(matches)}")
        face = matches[0]
        if any(face.contains(Point(other["at"])) for other in floor["places"] if other != place):
            raise ValueError(f"Unseparated source rooms at Sala {place['label']}")
        spaces.append({"id": f"sala-{place['label']}", "label": f"第 {place['label']} 厅", "placeId": f"museum-{place['label']}-1", "scope": "room", "polygons": BUILDER.polygons(face, [0, 0]), "sourcePaths": list(range(145)), "evidence": "Floor face from the official PDF's structural vector contours 0-144. Individually reviewed door gaps are closed for selection only; curved and angled boundaries remain source-derived. Display furniture is not a wall."})
        report["rooms"].append({"label": place["label"], "area": face.area, "bounds": list(face.bounds), "vertices": len(face.exterior.coords)})
    floor["spaces"] = spaces
    path.write_text(json.dumps(configs, ensure_ascii=False, indent=2) + "\n")
    report_path = ROOT / "sources/floorplans/rebuild-reports/scala-source-spaces.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report["rooms"], ensure_ascii=False))


if __name__ == "__main__":
    main()
