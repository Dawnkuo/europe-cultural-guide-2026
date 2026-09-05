"""Review and derive Uffizi room selection faces from the official vector plan."""

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
SOURCE_SHA = "160dc6ddcc85d25026f8218cb24e85636b953e8b87261d79c9a9ae88d944c3bb"
REVIEW = ROOT / "sources/floorplans/rebuild-reports/uffizi-reviewed-selection-cuts.json"
REJECTED_PROPOSALS = {"L1": {12, 96, 114}, "L2": {12, 51, 77, 79, 90}}
ADDITIONAL_CUTS = {
    "L1": [],
    "L2": [{"id": "reviewed-A13-corridor", "segment": [[579.65253, 141.09851], [589.56927, 141.09900]]}],
}


def geometry(document, floor):
    page = document[floor["page"] - 1]
    drawings = {index: (drawing, clip) for index, drawing, clip in BUILDER.visible_drawings(page)}
    ids = [819, 820, 821, 822] if floor["id"] == "L1" else [1125]
    surface = unary_union([BUILDER.fill_geometry(drawings[index][0])
                           .intersection(drawings[index][0]["channelClips"].get("fill", drawings[index][1]))
                           .intersection(box(*floor["crop"])) for index in ids])
    walls = []
    path_ids = []
    for index, (drawing, clip) in drawings.items():
        if BUILDER.color(drawing.get("color")) != (.779, .785, .793) or drawing["type"] != "s":
            continue
        if not box(*floor["crop"]).intersects(box(*drawing["rect"])):
            continue
        path_ids.append(index)
        for line in BUILDER.subpaths(drawing):
            walls.extend(p for p in parts(LineString(line).intersection(surface)) if p.geom_type == "LineString" and not p.is_empty)
    return surface, walls, path_ids, ids


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    config_path = ROOT / "sources/floorplans/extraction.json"
    configs = json.loads(config_path.read_text())
    config = next(c for c in configs if c["slug"] == "uffizi")
    source = ROOT / "sources/floorplans" / config["file"]
    if hashlib.sha256(source.read_bytes()).hexdigest() != SOURCE_SHA:
        raise ValueError("Uffizi official plan bytes changed")
    plan = json.loads((ROOT / "app/data/architectural-plans/uffizi.json").read_text())
    review = json.loads(REVIEW.read_text()) if args.apply else None
    if args.apply and (review["sourceSha256"] != SOURCE_SHA or not review["visuallyReviewed"]):
        raise ValueError("Source geometry and every selection cut must be reviewed before application")
    output = ROOT / "work/map-review/uffizi-source-faces"
    output.mkdir(parents=True, exist_ok=True)
    records = {"sourceSha256": SOURCE_SHA, "visuallyReviewed": False, "floors": {}}
    with fitz.open(source) as document:
        for floor in config["floors"]:
            if floor["id"] == "L0":
                continue
            surface, walls, wall_ids, surface_ids = geometry(document, floor)
            anchors = [{**p, "at": [p["at"][i] + floor["crop"][i] for i in (0, 1)]}
                       for p in plan["places"] if p["floorId"] == floor["id"] and p["kind"] == "room"]
            cuts = review["floors"][floor["id"]]["cuts"] if args.apply else [
                c for c in propose_cuts(surface, walls)
                if int(c["id"].removeprefix("cut-")) not in REJECTED_PROPOSALS[floor["id"]]
            ] + ADDITIONAL_CUTS[floor["id"]]
            faces, grouped, missing = derive(surface, walls, cuts, anchors)
            inventory = [{"labels": [p["label"] for p in places], "area": round(faces[i].area, 3),
                          "bounds": list(faces[i].bounds)} for i, places in grouped.items()]
            record = {"cuts": cuts, "inventory": inventory, "unbound": missing,
                      "wallPaths": wall_ids, "floorPaths": surface_ids}
            records["floors"][floor["id"]] = record
            overlay(document[floor["page"] - 1], floor, faces, grouped, cuts, output / f"{floor['id']}-source-selection.png")
            if args.apply:
                expected = review["floors"][floor["id"]]
                if inventory != expected["inventory"] or missing != expected["unbound"]:
                    raise ValueError(f"Reviewed room identity/geometry changed on {floor['id']}")
                if missing:
                    raise ValueError(f"Unbound source room labels: {missing}")
                floor["selectionSpaces"] = [{
                    "id": "rooms-" + "-".join(sorted(p["label"] for p in places)),
                    "label": " / ".join(sorted(p["label"] for p in places)),
                    "placeId": places[0]["id"], "scope": "room", "selectionOnly": True,
                    "polygons": BUILDER.polygons(faces[i], [0, 0]),
                    "sourcePaths": [*surface_ids, *wall_ids],
                    "evidence": "Exact official vector floor boundary and partition centerlines, joined only across individually reviewed source doorway gaps for selection. No walls, route edges or access permissions are added. Source labels in a continuous undivided space share a selector.",
                } for i, places in grouped.items()]
                floor["selectionCuts"] = [{**c, "reason": "Reviewed source partition gap; selection-only continuation, never an extruded wall."} for c in cuts]
            print(floor["id"], "cuts", len(cuts), "faces", len(faces), "groups", [item["labels"] for item in inventory], "unbound", missing)
    (output / "proposal.json").write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
    if args.apply:
        config_path.write_text(json.dumps(configs, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
