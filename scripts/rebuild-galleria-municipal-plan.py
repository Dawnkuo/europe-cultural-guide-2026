"""Normalize and extract Milan's published 2015 Galleria ground-floor plan."""
import hashlib
import json
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "sources/floorplans"
source = BASE / "galleria-comune-2015.pdf"
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
doc = fitz.open(source)
assert len(doc) == 1 and doc[0].rotation == 270
doc[0].remove_rotation()
derived = BASE / "derived/galleria-comune-2015-overhead.pdf"
doc.save(derived, garbage=4, deflate=True, no_new_id=True)
page = fitz.open(derived)[0]
config_path = BASE / "venues/galleria-vittorio.json"
config = json.loads(config_path.read_text())
config.update({
    "file": str(derived.relative_to(BASE)),
    "sha256": hashlib.sha256(derived.read_bytes()).hexdigest(),
    "url": "https://www.piazzascala.concorrimi.it/allegati/6.5_PLANIMETRIA%20GALLERIA%20VITTORIO%20EMANUELE%20II.pdf",
    "sourceProjection": {
        "kind": "orthographic", "pages": [1],
        "basis": "Comune di Milano January 2015 drawing 6.5 explicitly says Planimetria Piano Terra Galleria Vittorio Emanuele II, scala 1:500. It is an overhead architectural drawing, not a perspective. PDF display rotation 270 degrees is baked into native vectors without changing the aspect ratio or geometry."
    },
    "review": "Municipal existing-ground-floor survey published as attachment 6.5 to the 2015 Piazza Scala competition. Full drawing inspected: Piazza Duomo entrance on the right, Piazza Scala on the left, Via Ugo Foscolo above and Via Silvio Pellico below, with octagonal crossing, structural piers, individual shops, door swings and stairs. Only title-block and street-name typography are excluded. It is the existing-building attachment, not a competition proposal.",
    "internalNotes": [
        "Source PDF SHA256: " + source_hash,
        "PDF page rotation was normalized; no affine stretching, oblique tracing or invented architectural geometry was used.",
        "The municipal plan supersedes the incomplete 1867 arcade-only trace. Room divisions are retained as 2015 architectural evidence, not present-day tenant locations. No room identifiers are printed in this drawing.",
        "The bull mosaic has no individual position in this plan; its guide stop retains an area-level octagon binding, not a claimed artwork coordinate."
    ],
    "limitations": ["完整保留2015年地面层平面中的房间分隔、柱、门洞和楼梯；未将其视为当前商户位置。", "中央马赛克仅定位到八角厅区域；没有上层、屋顶或当前店铺的室内资料。"]
})
floor = config["floors"][0]
floor.update({"label": "地面层（2015年平面）", "page": 1, "crop": [230, 85, 1410, 1045],
              "spaces": [], "rules": [{
                  "type": ["s"], "kind": "detail", "tone": "stone",
                  "reason": "Complete visible native architectural linework after page-rotation normalization: partitions, pier profiles, door swings, stairs and interior outlines. Fine linework stays flat until individual masonry profiles are verified; none is silently dropped."
              }]})
positions = [[1395, 416], [1175, 416], [889, 416], [650, 441], [286, 449]]
for place, point in zip(floor["places"], positions):
    place["at"] = point
    place["evidence"] = "2015 municipal overhead plan: " + place["name"] + "; reviewed architectural-area anchor, not a tenant or individual artwork coordinate."
config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")
(BASE / "derived/galleria-comune-2015-manifest.json").write_text(json.dumps({
    "source": source.name, "sourceHash": source_hash,
    "derived": str(derived.relative_to(BASE)), "derivedHash": config["sha256"],
    "operation": "PyMuPDF Page.remove_rotation; display rotation 270 to 0, preserve appearance and native paths",
    "pathCount": len(page.get_drawings()), "pageSize": list(page.rect)
}, indent=2) + "\n")
print(config["sha256"], len(page.get_drawings()))
