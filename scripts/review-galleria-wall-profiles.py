"""Propose closed native contours for inspection, never auto-approve masonry."""
import importlib.util
import json
import sys
from pathlib import Path
import fitz
from PIL import Image, ImageDraw
from shapely.geometry import LineString, Point, box
from shapely.ops import polygonize, unary_union
from shapely import set_precision

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("plans", Path(__file__).with_name("build-architectural-plans.py"))
plans = importlib.util.module_from_spec(spec)
spec.loader.exec_module(plans)
page = fitz.open(ROOT / "sources/floorplans/derived/galleria-comune-2015-overhead.pdf")[0]
crop = box(230,85,1410,1045)
lines = []
for index,d,clip in plans.visible_drawings(page):
    if "s" in d["type"] and ("--structural" not in sys.argv or plans.color(d["color"]) == (0,0,0)):
        for part in plans.subpaths(d):
            line = set_precision(LineString(part), .01).intersection(clip).intersection(crop)
            if not line.is_empty:
                lines.append(line)
faces = sorted(polygonize(unary_union(lines)), key=lambda x:x.area, reverse=True)
data = [{"index":i,"area":round(p.area,3),"widthIndex":round(2*p.area/p.length,3),
         "bounds":list(p.bounds),"outer":list(p.exterior.coords),
         "holes":[list(r.coords) for r in p.interiors]} for i,p in enumerate(faces) if p.area>2]
out = ROOT / ("work/map-review/galleria-masonry" if "--structural" in sys.argv else "work/map-review/galleria-profiles")
out.mkdir(exist_ok=True)
(out / "candidates.json").write_text(json.dumps(data))
for batch in range(0,len(data),50):
    pix = page.get_pixmap(matrix=fitz.Matrix(1.5,1.5),clip=fitz.Rect(230,85,1410,1045))
    image = Image.frombytes("RGB",(pix.width,pix.height),pix.samples).convert("RGBA")
    overlay = Image.new("RGBA",image.size)
    draw = ImageDraw.Draw(overlay)
    for record in data[batch:batch+50]:
        p = faces[record["index"]]
        color = (220,30,30,110) if record["widthIndex"]<2 else (0,100,230,80)
        draw.polygon([((x-230)*1.5,(y-85)*1.5) for x,y in p.exterior.coords],fill=color)
        for hole in p.interiors:
            draw.polygon([((x-230)*1.5,(y-85)*1.5) for x,y in hole.coords],fill=(0,0,0,0))
        pt = p.representative_point()
        draw.text(((pt.x-230)*1.5,(pt.y-85)*1.5),str(record["index"]),fill="black",stroke_width=1,stroke_fill="white")
    Image.alpha_composite(image,overlay).convert("RGB").save(out / f"batch-{batch}.png")
print(len(faces),len(data))
print([(r["index"],r["area"],r["widthIndex"]) for r in data[:50]])

cuts = [[[845,119],[935,119]], [[845,705],[935,705]], [[1385,365],[1385,465]], [[245,452],[325,372]]]
with_cuts = list(polygonize(unary_union([*lines, *[LineString(cut) for cut in cuts]])))
public = [p for p in with_cuts if p.covers(Point(889,416))]
print("PUBLIC",[(p.area,p.bounds,len(p.exterior.coords),len(p.interiors)) for p in public])
if len(public)==1:
    p=public[0]
    (out/"public-candidate.json").write_text(json.dumps({"outer":list(p.exterior.coords),"holes":[list(r.coords) for r in p.interiors],"cuts":cuts}))
    pix=page.get_pixmap(matrix=fitz.Matrix(1.5,1.5),clip=fitz.Rect(230,85,1410,1045))
    image=Image.frombytes("RGB",(pix.width,pix.height),pix.samples).convert("RGBA")
    overlay=Image.new("RGBA",image.size)
    draw=ImageDraw.Draw(overlay)
    draw.polygon([((x-230)*1.5,(y-85)*1.5) for x,y in p.exterior.coords],fill=(10,130,240,100))
    for hole in p.interiors:
        draw.polygon([((x-230)*1.5,(y-85)*1.5) for x,y in hole.coords],fill=(0,0,0,0))
    Image.alpha_composite(image,overlay).convert("RGB").save(out/"public-candidate.png")
