"""Derive selectable galleries from the 2026 official Accademia Venice plan."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

import fitz
from shapely.geometry import LineString, box
from shapely.ops import unary_union

from source_selection_faces import derive, overlay, parts, propose_cuts

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("plans", ROOT / "scripts/build-architectural-plans.py")
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)
SOURCE_SHA = "6809eac6370f94b3a12017d6e243e3789135a4f9c97d1dc810f7c3d462a11264"
REVIEW = ROOT / "sources/floorplans/rebuild-reports/accademia-venice-reviewed-selection-cuts.json"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    config_path = ROOT / "sources/floorplans/venues/accademia-venice.json"
    config = json.loads(config_path.read_text())
    source = ROOT / "sources/floorplans" / config["file"]
    if hashlib.sha256(source.read_bytes()).hexdigest() != SOURCE_SHA:
        raise ValueError("Official Accademia plan bytes changed")
    plan = json.loads((ROOT / "app/data/architectural-plans/accademia-venice.json").read_text())
    review = json.loads(REVIEW.read_text()) if args.apply else None
    if args.apply and (review["sourceSha256"] != SOURCE_SHA or not review["visuallyReviewed"]):
        raise ValueError("Selection cuts require source visual review")
    output = ROOT / "work/map-review/accademia-venice-source-faces"
    output.mkdir(parents=True, exist_ok=True)
    record = {"sourceSha256": SOURCE_SHA, "visuallyReviewed": False, "floors": {}}
    with fitz.open(source) as document:
        for floor in config["floors"]:
            page = document[floor["page"] - 1]
            if floor["id"] == "first":
                wall_rule = next(r for r in floor["rules"] if r["kind"] == "wall")
                wall_rule["ids"] = list(dict.fromkeys([*wall_rule["ids"], 1161, 1162]))
            drawings = {i: (d, c) for i, d, c in BUILDER.visible_drawings(page)}
            surface_ids = floor["sourceSpaces"][0]["sourcePaths"]
            surface = unary_union([BUILDER.fill_geometry(drawings[i][0])
                .intersection(drawings[i][0]["channelClips"].get("fill", drawings[i][1]))
                .intersection(box(*floor["crop"])) for i in surface_ids])
            if floor["id"] == "first":
                # XXIII is patterned, not solid green. Its original PDF clip is
                # the room silhouette, including the three western recesses.
                source_clip = page.get_drawings(extended=True)[655]
                if source_clip["type"] != "clip":
                    raise ValueError("XXIII source clip identity changed")
                xxiii = BUILDER.fill_geometry(source_clip)
                if tuple(round(v, 2) for v in xxiii.bounds) != (1331.07, 944.23, 1767.71, 1158.02):
                    raise ValueError("XXIII source boundary changed")
                surface = surface.union(xxiii)
                if args.apply:
                    floor["spaces"] = [{
                        "id": "source-XXIII-footprint", "label": "XXIII",
                        "placeId": "first-XXIII-1", "scope": "room", "tone": "neutral",
                        "polygons": BUILDER.polygons(xxiii, [0, 0]),
                        "sourcePaths": [],
                        "evidence": "Exact original PDF extended clip 655 for the patterned XXIII gallery, pinned to source SHA256; retains the documented footprint despite temporary closure pattern. No inferred room geometry or access link.",
                    }]
            wall_ids = [i for rule in floor["rules"] if rule["kind"] == "wall" for i in rule["ids"]]
            walls = [part for i in wall_ids for line in BUILDER.subpaths(drawings[i][0])
                     for part in parts(LineString(line).intersection(surface)) if part.geom_type == "LineString"]
            anchors = [{**p, "at": [p["at"][i] + floor["crop"][i] for i in (0, 1)]}
                       for p in plan["places"] if p["floorId"] == floor["id"] and p["kind"] == "room"]
            cuts = review["floors"][floor["id"]]["cuts"] if args.apply else propose_cuts(surface, walls, max_gap=38)
            if not args.apply and floor["id"] == "first":
                # These rays extend the lift/stair block into XVIII or cross
                # a western XXIII recess, rather than close a printed doorway.
                cuts = [c for c in cuts if c["id"] not in {"cut-10", "cut-46", "cut-50"}]
            faces, groups, missing = derive(surface, walls, cuts, anchors)
            inventory = [{"labels": [p["label"] for p in places], "area": round(faces[i].area, 3),
                          "bounds": list(faces[i].bounds)} for i, places in groups.items()]
            record["floors"][floor["id"]] = {"cuts": cuts, "inventory": inventory, "unbound": missing,
                                           "wallPaths": wall_ids, "floorPaths": surface_ids}
            overlay(page, floor, faces, groups, cuts, output / f"{floor['id']}-source-selection.png")
            if args.apply:
                expected = review["floors"][floor["id"]]
                if inventory != expected["inventory"] or missing:
                    raise ValueError(f"Room identity/geometry review changed: {floor['id']} {missing}")
                floor["selectionSpaces"] = [{
                    "id": "rooms-" + "-".join(sorted(p["label"] for p in places)),
                    "label": " / ".join(sorted(p["label"] for p in places)),
                    "placeId": places[0]["id"], "scope": "room", "selectionOnly": True,
                    "polygons": BUILDER.polygons(faces[i], [0, 0]),
                    "sourcePaths": [*surface_ids, *wall_ids],
                    "evidence": "Official gallery silhouette and native partition lines with reviewed doorway closures for selection only. All actual source walls, voids, doors, treads and room IDs remain unchanged.",
                } for i, places in groups.items()]
                floor["selectionCuts"] = [{**c, "reason": "Reviewed source door gap, selection only; no wall or walking connection is added."} for c in cuts]
            print(floor["id"], "cuts", len(cuts), "groups", [i["labels"] for i in inventory], "unbound", missing)
    (output / "proposal.json").write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
    if args.apply:
        config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
