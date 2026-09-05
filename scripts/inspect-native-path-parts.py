"""Render native PDF subpaths over a source crop for geometry review."""
import argparse
import importlib.util
from pathlib import Path
import fitz
from PIL import Image, ImageDraw

parser = argparse.ArgumentParser()
parser.add_argument("file")
parser.add_argument("page", type=int)
parser.add_argument("path", type=int)
parser.add_argument("crop", nargs=4, type=float)
parser.add_argument("output")
args = parser.parse_args()
spec = importlib.util.spec_from_file_location("plans", Path(__file__).with_name("build-architectural-plans.py"))
plans = importlib.util.module_from_spec(spec)
spec.loader.exec_module(plans)
page = fitz.open(args.file)[args.page - 1]
scale = 12
pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=fitz.Rect(args.crop))
canvas = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples).convert("RGBA")
overlay = Image.new("RGBA", canvas.size)
draw = ImageDraw.Draw(overlay)
for i, points in enumerate(plans.subpaths(page.get_drawings()[args.path])):
    points = [((x-args.crop[0])*scale, (y-args.crop[1])*scale) for x,y in points]
    hue = [(220,30,30,160),(20,80,240,160),(0,180,80,160)][i % 3]
    draw.line(points, fill=hue, width=3)
    if len(points)>10:
        draw.text(points[len(points)//2], str(i), fill="red")
Image.alpha_composite(canvas, overlay).convert("RGB").save(args.output)
