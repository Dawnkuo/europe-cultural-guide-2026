"""Inspect source PDFs without putting source documents in the public build."""
import argparse
import collections
import json
from pathlib import Path

import fitz

parser = argparse.ArgumentParser()
parser.add_argument("source")
parser.add_argument("pages", nargs="+", type=int)
args = parser.parse_args()
output = Path("work/map-review")
output.mkdir(parents=True, exist_ok=True)
document = fitz.open(args.source)
for number in args.pages:
    page = document[number - 1]
    drawings = page.get_drawings()
    print(number, page.rect, "paths", len(drawings))
    print(collections.Counter(
        (item["type"], tuple(round(x, 3) for x in (item["fill"] or item["color"] or [])))
        for item in drawings
    ).most_common(20))
    prefix = output / f"{Path(args.source).stem}-{number}"
    page.get_pixmap(matrix=fitz.Matrix(1.6, 1.6)).save(f"{prefix}.png")
    records = [{"id": i, "rect": list(item["rect"]), "fill": item["fill"],
                "stroke": item["color"], "width": item["width"], "type": item["type"],
                "items": [[str(x) for x in segment] for segment in item["items"]]}
               for i, item in enumerate(drawings)]
    Path(f"{prefix}-paths.json").write_text(json.dumps(records, indent=2))
    Path(f"{prefix}-words.json").write_text(json.dumps(page.get_text("words"), indent=2))
