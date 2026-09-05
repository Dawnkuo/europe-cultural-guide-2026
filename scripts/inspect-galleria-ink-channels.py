"""Separate native stroke colors for semantic review, not production rendering."""
import importlib.util
from pathlib import Path
import fitz
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("plans", Path(__file__).with_name("build-architectural-plans.py"))
plans = importlib.util.module_from_spec(spec)
spec.loader.exec_module(plans)
page = fitz.open(ROOT / "sources/floorplans/derived/galleria-comune-2015-overhead.pdf")[0]
for name, black in [("black",True),("gray",False)]:
    image=Image.new("RGB",(1770,1440),"white")
    draw=ImageDraw.Draw(image)
    for i,d,clip in plans.visible_drawings(page):
        if "s" not in d["type"] or (plans.color(d["color"])==(0,0,0))!=black:
            continue
        for points in plans.subpaths(d):
            draw.line([((x-230)*1.5,(y-85)*1.5) for x,y in points],fill="black",width=1)
    image.save(ROOT / f"work/map-review/galleria-{name}-ink.png")
