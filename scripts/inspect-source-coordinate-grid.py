"""Render native PDF coordinates for visual point-location review."""
import argparse
from pathlib import Path
import fitz

parser = argparse.ArgumentParser()
parser.add_argument("file")
parser.add_argument("page", type=int)
parser.add_argument("crop", nargs=4, type=float)
parser.add_argument("output")
args = parser.parse_args()
doc = fitz.open(args.file)
page = doc[args.page - 1]
page.set_rotation(0)
x0,y0,x1,y1 = args.crop
for x in range(int(x0 // 10 * 10), int(x1), 10):
    page.draw_line((x,y0),(x,y1),color=(.9,.3,.2),width=.1,stroke_opacity=.4)
    page.insert_text((x+.3,y0+4),str(x),fontsize=3,color=(.8,0,0))
for y in range(int(y0 // 10 * 10), int(y1), 10):
    page.draw_line((x0,y),(x1,y),color=(.9,.3,.2),width=.1,stroke_opacity=.4)
    page.insert_text((x0+.3,y-.3),str(y),fontsize=3,color=(.8,0,0))
page.get_pixmap(matrix=fitz.Matrix(5,5),clip=fitz.Rect(args.crop)).save(args.output)
