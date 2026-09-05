"""Propose source-wall-bounded selection faces for individual review."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

import fitz
from shapely.affinity import translate
from shapely.geometry import LineString, Point, Polygon, box
from shapely.ops import unary_union

from source_selection_faces import overlay, parts

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("plans", ROOT / "scripts/build-architectural-plans.py")
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def geometry(polygons):
    return unary_union([Polygon(p["outer"], p.get("holes", [])) for p in polygons])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("slugs", nargs="+")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    for slug in args.slugs:
        config_path = ROOT / f"sources/floorplans/venues/{slug}.json"
        config = json.loads(config_path.read_text())
        model = json.loads((ROOT / f"app/data/architectural-plans/{slug}.json").read_text())
        recipe_path = ROOT / f"sources/floorplans/rebuild-reports/{slug}-region-recipe.json"
        recipe = json.loads(recipe_path.read_text()) if recipe_path.exists() else {}
        files = {"primary": config["file"], **{s["id"]: s["file"] for s in config.get("sourceFiles", [])}}
        output = ROOT / f"work/map-review/{slug}-selection-regions"
        output.mkdir(parents=True, exist_ok=True)
        report = {"slug": slug, "sourceDigests": model.get("sourceDigests", {"primary": model["sourceDigest"]}), "floors": {}}
        for floor in model["floors"]:
            floor_config = next(f for f in config["floors"] if f["id"] == floor["id"])
            origin = floor_config["crop"][:2]
            rules = recipe.get(floor["id"], {})
            cuts = [{"id": f"threshold-{i+1}", "segment": segment} for i, segment in enumerate(rules.get("cuts", []))]
            base = [feature for feature in floor["features"] if not feature["id"].endswith("-floor")]
            walls = unary_union([geometry(f["polygons"]) for f in base if f["kind"] == "wall" or f["id"] in rules.get("boundaryDetails", [])])
            barriers = unary_union([walls, *[translate(LineString(c["segment"]).buffer(.05, cap_style=3), -origin[0], -origin[1]) for c in cuts]])
            universe = box(*floor["bounds"])
            faces = [p for p in parts(universe.difference(barriers)) if p.geom_type == "Polygon"]
            places = [p for p in model["places"] if p["floorId"] == floor["id"] and ("placeIds" not in rules or p["id"] in rules["placeIds"])]
            selectors, records, preview_faces, grouped = [], [], [], {}
            seen = {}
            for place in places:
                point = Point(place["at"])
                surface_ids = rules.get("surfaceFeatures", {}).get(place["id"])
                face = unary_union([geometry(f["polygons"]) for f in base if f["id"] in surface_ids]) if surface_ids else next((f for f in faces if f.covers(point)), None)
                unresolved = face is None or not face.covers(point) or (not surface_ids and face.intersects(universe.boundary))
                record = {"placeId": place["id"], "unresolved": unresolved}
                if not unresolved:
                    shape_hash = hashlib.sha256(face.normalize().wkb).hexdigest()
                    record.update({"shapeSha256": shape_hash, "area": round(face.area, 5), "bounds": list(face.bounds)})
                    if shape_hash not in seen:
                        translated = translate(face, origin[0], origin[1])
                        source_paths = surface_ids or [f["id"] for f in base if f["kind"] == "wall"]
                        selectors.append({"id": f"region-{len(selectors)+1}", "label": place["name"], "placeId": place["id"], "scope": "collection" if surface_ids else "room", "selectionOnly": True,
                                          "polygons": BUILDER.polygons(translated, [0, 0]), "sourcePaths": source_paths,
                                          "evidence": "Exact source-derived boundary faces; reviewed source doorway cuts affect selection only, never masonry. Theme-floor selections use original published surface compounds without invented room partitions."})
                        seen[shape_hash] = len(selectors)-1
                        preview_faces.append(translated)
                        grouped[len(preview_faces)-1] = [place]
                records.append(record)
            with fitz.open(ROOT / "sources/floorplans" / files[floor_config.get("sourceId", "primary")]) as document:
                overlay(document[floor_config["page"]-1], floor_config, preview_faces, grouped, cuts, output / f"{floor['id']}.png")
            report["floors"][floor["id"]] = {"geometryDigest": digest(base), "recipe": rules, "regions": records}
            floor_config["selectionSpaces"] = selectors
            floor_config["selectionCuts"] = cuts
            print(slug, floor["id"], [(r["placeId"], "unresolved" if r["unresolved"] else round(r["area"], 1)) for r in records])
        (output / "proposal.json").write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n")
        if args.apply:
            review = json.loads((ROOT / f"sources/floorplans/rebuild-reports/{slug}-reviewed-regions.json").read_text())
            if not review.get("visualReview") or report["sourceDigests"] != review["sourceDigests"] or report["floors"] != review["floors"]:
                raise ValueError(f"Missing or stale source-face review: {slug}")
            config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2)+"\n")
            BUILDER.build(config)


if __name__ == "__main__":
    main()
