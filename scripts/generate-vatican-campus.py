#!/usr/bin/env python3
"""Redraw the official compound context; this is not extrusion geometry."""
import hashlib
import importlib.util
import json
from pathlib import Path

import cv2
import fitz
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("source_trace", Path(__file__).with_name("trace-vatican-compound-source.py"))
trace = importlib.util.module_from_spec(spec)
spec.loader.exec_module(trace)


def paths(mask):
    parts = trace.pixel_polygons(mask)
    return "".join('<path d="' + " ".join(
        "M" + " L".join(f"{x:g},{y:g}" for x, y in ring.coords) + " Z"
        for ring in [part.exterior, *part.interiors]
    ) + '"/>' for part in parts), len(parts)


def union_rois(shape, polygons):
    result = np.zeros(shape, np.uint8)
    # fillPoly with all polygons at once uses parity at overlaps, which would
    # erase source buildings shared by two classification regions.
    for polygon in polygons:
        cv2.fillPoly(result, [np.array(polygon, np.int32)], 1)
    return result


def main():
    source = ROOT / "work/experience/vatican-compound-source/state-plan-2023.pdf"
    assert hashlib.sha256(source.read_bytes()).hexdigest() == trace.SOURCE_HASH
    document = fitz.open(source)
    pix = fitz.Pixmap(document, document[0].get_images()[0][0])
    assert (pix.width, pix.height, pix.n) == (2067, 2923, 3)
    rgb = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, 3)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    ink = cv2.inRange(hsv, np.array([17, 125, 110]), np.array([36, 255, 255])) > 0
    scope = np.zeros(ink.shape, np.uint8)
    scope[1270:2510, 385:1815] = 1
    scope[2020:2285, 1625:1815] = 0  # Printed photograph, not architecture.
    # Restrict the overview to reviewed building clusters, excluding garden
    # hatching, unrelated service blocks and fragments of the printed key.
    # These ROIs classify ink; they are never emitted as building outlines.
    building_rois = [
        [[473, 1421], [688, 1415], [808, 1470], [830, 1700], [837, 1877], [471, 1904]],
        [[746, 1700], [1807, 1682], [1784, 1958], [1180, 1960], [1069, 2160], [730, 2100]],
        [[1453, 1363], [1528, 1338], [1560, 1638], [1597, 1636], [1604, 1716], [1582, 1718], [1577, 1657], [1473, 1620]],
        [[1518, 1300], [1555, 1268], [1641, 1319], [1691, 1513], [1744, 1668], [1603, 1660]],
        [[802, 1910], [1046, 1907], [1074, 2046], [1024, 2227], [935, 2227], [763, 2121]],
        [[470, 1850], [795, 1850], [790, 2165], [509, 2165]],
        [[389, 2110], [536, 2110], [552, 2484], [389, 2484]],
        [[745, 2110], [905, 2110], [905, 2484], [745, 2484]],
    ]
    building_scope = union_rois(ink.shape, building_rois)
    scope &= building_scope
    ink &= scope > 0

    # The official plan depicts the colonnades mostly in grey, not gold.
    # These reviewed ROIs classify that existing ink; they draw no columns.
    colonnade_rois = [
        [[510, 2115], [530, 2161], [475, 2200], [451, 2245], [441, 2289],
         [450, 2338], [479, 2382], [537, 2419], [514, 2471], [461, 2437],
         [419, 2388], [395, 2331], [394, 2272], [407, 2218], [447, 2160]],
        [[765, 2115], [823, 2151], [867, 2201], [895, 2264], [901, 2310],
         [889, 2358], [858, 2410], [804, 2450], [777, 2473], [756, 2421],
         [812, 2388], [845, 2345], [855, 2295], [844, 2243], [815, 2197], [765, 2165]],
    ]
    colonnade_scope = union_rois(ink.shape, colonnade_rois)
    grey = (hsv[:, :, 1] < 80) & (hsv[:, :, 2] < 200) & (colonnade_scope > 0)
    building_paths, building_count = paths(ink)
    colonnade_paths, colonnade_count = paths(grey)
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="385 1270 1430 1240">'
           '<g fill="#cbb783" fill-rule="evenodd">' + building_paths + '</g>'
           '<g fill="#a8bac8" fill-rule="evenodd">' + colonnade_paths + '</g></svg>\n')
    out = ROOT / "public/maps/vatican-campus.svg"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(svg)
    report = {
        "source": {"url": trace.SOURCE_URL, "sha256": trace.SOURCE_HASH, "page": 1},
        "projection": "orthographic; native image axes; north right",
        "scope": [385, 1270, 1815, 2510],
        "geometryUse": "two-dimensional source-ink context only; not rooms, roofs or extrusion footprints",
        "colonnadeClassificationRois": colonnade_rois,
        "buildingClassificationRois": building_rois,
        "selectedPixels": {"gold": int(ink.sum()), "greyColonnades": int(grey.sum())},
        "fragments": {"gold": building_count, "greyColonnades": colonnade_count},
        "svgSha256": hashlib.sha256(svg.encode()).hexdigest(),
        "morphology": "none", "simplification": "none", "syntheticGeometry": "none",
        "limitations": ["Printed badges can interrupt the source fill.",
                        "Region anchors describe areas, never artwork positions or walkable connections.",
                        "Modern room names and floor links come from the separate reviewed visitor plan.",
                        "No height is inferred from this drawing."],
    }
    (ROOT / "sources/exteriors/vatican-campus-extraction.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report["selectedPixels"]))


if __name__ == "__main__":
    main()
