"""Derive room selections from pinned Picasso visitor-plan vectors."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

import fitz
from shapely.geometry import LineString, Point
from shapely.ops import unary_union

from source_selection_faces import overlay, parts

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("plans", ROOT / "scripts/build-architectural-plans.py")
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)
SHA = "14d9f2035c5318ca1f14603596ec4c171f12326a467cc0660dec5a6556aed641"
REVIEW = ROOT / "sources/floorplans/rebuild-reports/picasso-reviewed-room-selections.json"
EXTRA_WALLS = [78, 79, 80, 82, 90, 93, 94, 95, 98, 149, 167]


def doorway_cuts(drawings):
    def r(i):
        return drawings[i][0]["rect"]
    # Endpoints are jamb edges on the source, never walls in the output.
    return [
        ("1-2", [84, 82], [[r(84).x0 + r(84).width / 2, r(84).y1], [r(82).x0 + r(82).width / 2, r(82).y0]]),
        ("2-3", [97, 98], [[r(97).x0 + r(97).width / 2, r(97).y1], [r(98).x0 + r(98).width / 2, r(98).y0]]),
        ("3-4", [92, 155], [[r(92).x1, r(92).y0 + r(92).height / 2], [r(155).x0, r(92).y0 + r(92).height / 2]]),
        ("5-6", [172, 92], [[r(172).x1, r(172).y0 + r(172).height / 2], [r(92).x0, r(92).y0 + r(92).height / 2]]),
        ("6-7", [78, 39, 41], [[r(78).x0 + r(78).width / 2, r(78).y1], [r(78).x0 + r(78).width / 2, r(41).y0]]),
        ("8-9", [132, 168], [[r(132).x0 + 2, r(132).y1], [r(168).x0 + 2, r(168).y0]]),
        ("9-10", [166, 167], [[r(166).x1, r(166).y0 + r(166).height / 2], [r(167).x0, r(167).y0 + r(167).height / 2]]),
        ("10-11", [145, 146], [[r(145).x0 + r(145).width / 2, r(145).y1], [r(146).x0 + r(146).width / 2, r(146).y0]]),
        ("12-13", [152, 64], [[r(152).x0 + r(152).width / 2, r(152).y1], [r(152).x0 + r(152).width / 2, r(64).y0 + r(64).height / 2]]),
        ("14-15", [148, 163, 149], [[r(148).x0 + r(148).width / 2, r(148).y1], [r(148).x0 + r(148).width / 2, r(163).y0 + r(163).height / 2]]),
        ("14-15-to-16", [163, 149], [[r(163).x1, r(163).y0 + r(163).height / 2], [r(149).x0, r(149).y0 + r(149).height / 2]]),
        ("B2-west", [79, 50], [[r(79).x0 + r(79).width / 2, r(79).y1], [r(50).x0 + 2, r(50).y0]]),
        ("B1-west", [50, 80], [[r(50).x0 + 2, r(50).y1], [r(80).x0 + r(80).width / 2, r(80).y0]]),
    ]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    path = ROOT / "sources/floorplans/venues/picasso-barcelona.json"
    config = json.loads(path.read_text())
    source = ROOT / "sources/floorplans" / config["file"]
    if hashlib.sha256(source.read_bytes()).hexdigest() != SHA:
        raise ValueError("Picasso source bytes changed")
    plan = json.loads((ROOT / "app/data/architectural-plans/picasso-barcelona.json").read_text())
    output = ROOT / "work/map-review/picasso-room-selections"
    output.mkdir(parents=True, exist_ok=True)
    document = fitz.open(source)
    floor = config["floors"][1]
    page = document[floor["page"] - 1]
    wall_rule = next(r for r in floor["rules"] if r["kind"] == "wall")
    wall_rule["ids"] = list(dict.fromkeys([*wall_rule["ids"], *EXTRA_WALLS]))
    if not any(39 in r.get("ids", []) and r["kind"] == "wall" for r in floor["rules"]):
        floor["rules"].append({"ids": [39], "channel": "fill", "kind": "wall", "overpaintFillPaths": [41],
                               "reason": "Native L-shaped service core, with later grey lift fill 41 retained as an interior hole rather than extruded solid masonry."})
    drawings = {i: (d, c) for i, d, c in BUILDER.visible_drawings(page)}
    wall_ids = [*wall_rule["ids"], 39]
    surface_ids = [33, 34, 36, 119, 120, 121]
    walls = unary_union([BUILDER.fill_geometry(drawings[i][0]).intersection(drawings[i][1]) for i in wall_ids]).difference(BUILDER.fill_geometry(drawings[41][0]))
    surface = unary_union([BUILDER.fill_geometry(drawings[i][0]).intersection(drawings[i][1]) for i in surface_ids]).difference(walls)
    cuts = [{"id": name, "sourcePaths": ids, "segment": segment} for name, ids, segment in doorway_cuts(drawings)]
    cuts_geometry = unary_union([LineString(c["segment"]).buffer(.03) for c in cuts])
    faces = [p for p in parts(surface.difference(cuts_geometry)) if p.geom_type == "Polygon"]
    groups, missing = {}, []
    anchors = [{**p, "at": [p["at"][i] + floor["crop"][i] for i in (0, 1)]} for p in plan["places"] if p["floorId"] == "L1" and p["kind"] == "room"]
    for p in anchors:
        matches = [i for i, face in enumerate(faces) if face.covers(Point(p["at"]))]
        if len(matches) != 1:
            missing.append(p["id"])
        else:
            groups.setdefault(matches[0], []).append(p)
    inventory = [{"labels": [p["label"] for p in group], "area": round(faces[i].area, 3), "bounds": list(faces[i].bounds)} for i, group in groups.items()]
    record = {"sourceSha256": SHA, "visuallyReviewed": False, "cuts": cuts, "addedNativeWalls": EXTRA_WALLS, "inventory": inventory, "unbound": missing}
    overlay(page, floor, faces, groups, cuts, output / "first-source-selections.png")
    (output / "proposal.json").write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
    print("Room groups", [g["labels"] for g in inventory], "unbound", missing)
    if not args.apply:
        return
    review = json.loads(REVIEW.read_text())
    if not review["visuallyReviewed"] or review["sourceSha256"] != SHA or review["inventory"] != inventory or missing:
        raise ValueError("Source overlays/room inventory require review")
    floor["selectionSpaces"] = [{
        "id": "rooms-" + "-".join(p["label"] for p in group), "label": " / ".join(p["label"] for p in group),
        "placeId": group[0]["id"], "scope": "room", "selectionOnly": True,
        "polygons": BUILDER.polygons(faces[i], [0, 0]), "sourcePaths": [*surface_ids, *wall_ids],
        "evidence": "Exact visitor floor fills minus the complete reviewed wall polygons, with source-jamb gaps closed for selection only; not new walls or access permissions.",
    } for i, group in groups.items()]
    floor["selectionCuts"] = cuts
    config["floors"][0]["sourceSpaces"] = [{
        "id": "meca-source-stair", "label": "Meca宫楼梯", "placeId": "L0-Meca楼梯-1", "sourcePaths": [47, 67],
        "evidence": "Exact yellow original Meca stair-flight and landing polygons in the official ground plan. Does not fabricate a polygon for the unbounded white circulation court.",
    }]
    path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
