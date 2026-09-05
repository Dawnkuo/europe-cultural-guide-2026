"""Recover individually reviewed masonry contours without filling shop rooms."""
import importlib.util
import json
from pathlib import Path
import fitz
from shapely import set_precision
from shapely.geometry import LineString, box
from shapely.ops import polygonize, unary_union
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "sources/floorplans"
spec = importlib.util.spec_from_file_location("plans", Path(__file__).with_name("build-architectural-plans.py"))
plans = importlib.util.module_from_spec(spec)
spec.loader.exec_module(plans)
path = BASE / "venues/galleria-vittorio.json"
config = json.loads(path.read_text())
page = fitz.open(BASE / config["file"])[0]
drawings = page.get_drawings()
crop = box(*config["floors"][0]["crop"])
lines, owners = [], []
for index, drawing, clip in plans.visible_drawings(page):
    if "s" not in drawing["type"] or plans.color(drawing["color"]) != (0, 0, 0):
        continue
    for part in plans.subpaths(drawing):
        line = set_precision(LineString(part), .01).intersection(clip).intersection(crop)
        if not line.is_empty:
            lines.append(line)
            owners.append(index)
faces = sorted(polygonize(unary_union(lines)), key=lambda p: p.area, reverse=True)
assert len(faces) == 1885, "Native contour inventory changed; re-review overlays"

# Reviewed on the municipal drawing with numbered, source-aligned overlays.
# Exclusions are enclosed shops, stair landings, lift cabins or unresolved
# service pockets, not structural mass. All their native linework stays flat.
excluded = {
    0,1,6,10,13,16,22,23,28,33,40,45,50,58,59,67,69,74,79,83,87,88,99,
    115,116,118,123,129,130,132,142,144,150,154,156,159,161,168,170,172,
    180,181,184,194,195,199,205,212,215,218,220,224,233,235,238,241,248,
    249,257,258,259,273,279,280,287,288,290,293,296,298,299,303,312,314,
    315,316,319,320,324,326,330,332,336,338,340,341,350,352,363,381,382,
    383,384,392,397,399,401,413,414,416,418,420,421,423,424,427,428,
    429,434,436,437,438,444,446,448
}
selected = [i for i in range(450) if i not in excluded and 2 * faces[i].area / faces[i].length >= 2]
tree = STRtree(lines)
profile_paths = {}
for i in selected:
    face = faces[i]
    # Keep the originating PDF path IDs, not a hand-redrawn replacement.
    owners_here = sorted({owners[j] for j in tree.query(box(*face.bounds).buffer(1))})
    profile_paths[str(i)] = owners_here
groups = [{"id": "municipal-masonry", "ids": sorted(set(owners)),
           "endpointGrid": .01, "clipBounds": config["floors"][0]["crop"],
           "expectedAreas": [round(p.area,2) for p in faces], "profileIndices": selected,
           "profileSourcePaths": profile_paths,
           "evidence": "Municipal 2015 ground plan, individually reviewed closed black-ink masonry contours. Native vertices and voids retained; contextual line noding is pinned to the complete source graph. Gray doors/stairs and enclosed room or lift interiors excluded from masonry."}]
rebuilt = plans.closed_wall_profiles(drawings, groups[0])
assert all(actual.symmetric_difference(faces[index]).area < .001 for index,actual in zip(selected,rebuilt))
config["floors"][0]["wallProfiles"] = groups
config["floors"][0]["rules"][0]["reason"] = "Complete native architectural strokes: every partition, pier, door swing, glazing outline and stair tread is retained as flat detail; separately reviewed closed masonry profiles alone are extruded."
config["internalNotes"] = list(dict.fromkeys([*config["internalNotes"],
    "Numbered native-profile overlays reviewed across the complete municipal ground plan. Only individually approved black wall/pier contours receive wall height. All other strokes remain visible in both views; uncertain enclosed shop/service areas are not filled as masonry."]))
path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")
print("Approved masonry profiles", len(selected))
