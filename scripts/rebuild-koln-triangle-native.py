"""Recover native filled masonry and reject the projected ground-floor envelope."""
import importlib.util
import json
from pathlib import Path
import fitz
from shapely.geometry import MultiPoint, box

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("plans", Path(__file__).with_name("build-architectural-plans.py"))
plans = importlib.util.module_from_spec(spec)
spec.loader.exec_module(plans)
path = ROOT / "sources/floorplans/venues/koln-triangle.json"
config = json.loads(path.read_text())
doc = fitz.open(ROOT / "sources/floorplans" / config["file"])
for floor in config["floors"]:
    ds = doc[floor["page"]-1].get_drawings()
    crop = box(*floor["crop"])
    wall_ids, flat_ids = [], []
    for i,d in enumerate(ds):
        if d["type"] not in ("f", "fs") or plans.color(d["fill"]) != (0,0,0):
            continue
        geometry = plans.fill_geometry(d).intersection(crop)
        if geometry.is_empty:
            continue
        # The black stair treads are much thinner than the source's masonry.
        # Record their exact IDs in the config so this classification is reviewable.
        thickness = 2 * geometry.area / geometry.length
        (wall_ids if thickness >= .09 else flat_ids).append(i)
    floor["rules"] = [
        {"ids": wall_ids, "channel": "fill", "kind": "wall", "tone": "stone",
         "reason": "Native black filled concrete/partition profiles and solid columns, visually checked against the architect's plan. Compound-path holes stay open; no floor or furniture outline is extruded."},
        {"ids": flat_ids, "channel": "fill", "kind": "detail", "tone": "stone",
         "reason": "Native thin stair-tread/service details retain their black fill as flat ink, not full-height masonry."},
        {"type": ["s", "fs"], "colors": [[0,0,0]], "kind": "detail", "tone": "stone",
         "reason": "All remaining source linework inside the reviewed crop: glass facade, doors, stairs, lift cabins, furniture and dashed projections. Dashed upper-floor projections stay flat and do not define the ground-floor footprint."}
    ]
    if floor["id"] == "ground":
        floor["spaces"] = []
    else:
        # These published upper-floor facades are convex. Retain all native
        # glazing vertices; do not resample them into the old 16-point outline.
        source_id = 130 if floor["id"] == "office-typical" else 40
        native = [point for part in plans.subpaths(ds[source_id]) for point in part]
        envelope = MultiPoint(native).convex_hull
        floor["spaces"][0].update({
            "outer": [[round(x,5),round(y,5)] for x,y in envelope.exterior.coords],
            "sourcePaths": [source_id], "scope": "floor",
            "evidence": "Outer convex glazing envelope reconstructed from all native facade-path vertices, including the original curved-edge sampling. This is a whole-floor footprint, not a room. Internal core partitions and door gaps are retained separately as native geometry."
        })
    print(floor["id"], "masonry", len(wall_ids), "flat-filled", len(flat_ids))
config["review"] = "Architect-published monograph pp.3-4, individually compared against native high-resolution source crops. All source black filled core walls, radial partitions and columns are recovered in addition to glass/door/furniture linework. Upper floors follow the many native facade vertices. The former ground envelope was actually the dashed projection of upper floors and has been removed, not rounded into a fictional ground slab."
config["internalNotes"] = list(dict.fromkeys([*config["internalNotes"],
    "Ground native path 325 is an upper-storey projection, visually confirmed with subpath overlays. It remains dashed detail only; no ground slab is inferred across the low-rise junction or external door openings.",
    "Upper-floor native paths 130 and 40 carry the convex glazing perimeter; original facade samples replace the coarse manual outlines. The floor surface is a display footprint, not a navigable room or published access permission."
]))
path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")
