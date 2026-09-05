#!/usr/bin/env python3
"""Validate, render, and inventory the strict Pisa five-venue package."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "sources/floorplans"
DERIVED = SOURCES / "derived"
MODELS = ROOT / "app/data/architectural-plans"
EVIDENCE = SOURCES / "evidence"
QA = ROOT / "qa"
REPORTS = ROOT / "reports"
PYTHON = sys.executable


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def semantic_masks(path: Path) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    rgb = np.asarray(Image.open(path).convert("RGB"))
    walls = np.all(rgb == (0, 0, 0), axis=2)
    details = np.all(rgb == (128, 128, 128), axis=2)
    return rgb, walls, details


def paint_polygon_local(
    image: Image.Image,
    outer: list[list[float]],
    holes: list[list[list[float]]],
    fill: str,
    scale: float,
) -> None:
    rings = [outer, *holes]
    x0 = max(0, int(min(point[0] for ring in rings for point in ring) * scale) - 1)
    y0 = max(0, int(min(point[1] for ring in rings for point in ring) * scale) - 1)
    x1 = min(image.width, int(max(point[0] for ring in rings for point in ring) * scale) + 2)
    y1 = min(image.height, int(max(point[1] for ring in rings for point in ring) * scale) + 2)
    if x1 <= x0 or y1 <= y0:
        return
    mask = Image.new("L", (x1 - x0, y1 - y0), 0)
    draw = ImageDraw.Draw(mask)

    def points(ring: list[list[float]]) -> list[tuple[float, float]]:
        return [(point[0] * scale - x0, point[1] * scale - y0) for point in ring]

    draw.polygon(points(outer), fill=255)
    for hole in holes:
        draw.polygon(points(hole), fill=0)
    image.paste(fill, (x0, y0, x1, y1), mask)


def render_floor(slug: str, floor_id: str, source_size: tuple[int, int]) -> Path:
    model = json.loads((MODELS / f"{slug}.json").read_text())
    floor = next(item for item in model["floors"] if item["id"] == floor_id)
    source_width, source_height = source_size
    scale = min(1.0, 1200 / source_width, 1050 / source_height)
    image = Image.new(
        "RGB",
        (max(1, round(source_width * scale)), max(1, round(source_height * scale))),
        "white",
    )
    fills = {"surface": "#e7e2d8", "detail": "#909090", "wall": "#171717"}
    for feature in floor["features"]:
        for polygon in feature["polygons"]:
            paint_polygon_local(
                image,
                polygon["outer"],
                polygon.get("holes", []),
                fills[feature["kind"]],
                scale,
            )
    output = QA / "model-renders" / f"{slug}-{floor_id}.png"
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, compress_level=9)
    return output


def contact_sheet(
    name: str,
    source_path: Path,
    semantic_path: Path,
    model_path: Path,
) -> Path:
    labels = ["authoritative source crop", "source pixels: wall black / detail gray", "generated model"]
    images = [Image.open(path).convert("RGB") for path in [source_path, semantic_path, model_path]]
    cell_width, cell_height = 520, 420
    contact = Image.new("RGB", (cell_width * 3, cell_height + 72), "white")
    draw = ImageDraw.Draw(contact)
    draw.text((12, 10), name, fill="black")
    for index, (image, label) in enumerate(zip(images, labels)):
        fitted = ImageOps.contain(image, (cell_width - 20, cell_height - 20))
        left = index * cell_width + (cell_width - fitted.width) // 2
        top = 34 + (cell_height - fitted.height) // 2
        contact.paste(fitted, (left, top))
        draw.text((index * cell_width + 10, cell_height + 46), label, fill="black")
    output = QA / "contacts" / f"{name}.png"
    output.parent.mkdir(parents=True, exist_ok=True)
    contact.save(output, compress_level=9)
    return output


def relevant_hashes() -> dict[str, str]:
    files: list[Path] = []
    for pattern in [
        "sources/floorplans/derived/*.pdf",
        "sources/floorplans/venues/*.json",
        "sources/floorplans/evidence/*.json",
        "app/data/architectural-plans/*.json",
    ]:
        files.extend(sorted(ROOT.glob(pattern)))
    return {str(path.relative_to(ROOT)): digest(path) for path in sorted(set(files))}


def run_replay() -> dict[str, str]:
    producer = ROOT / "scripts/rebuild-pisa-strict-five.py"
    subprocess.run(
        [PYTHON, str(producer), "--derive-only"],
        cwd=ROOT,
        check=True,
        stdout=(QA / "replay-derive.log").open("w"),
    )
    subprocess.run(
        [PYTHON, str(producer), "--build-only"],
        cwd=ROOT,
        check=True,
        stdout=(QA / "replay-build.log").open("w"),
    )
    return relevant_hashes()


def validate(replay: bool) -> dict:
    derivation = json.loads((REPORTS / "strict-five-derivation.json").read_text())
    checks: dict[str, dict] = {}

    builder_hash = digest(ROOT / "scripts/build-architectural-plans.py")
    assert_true(
        builder_hash == "5def3873d9e690de1ebe97b222fe7735a05b780d68b98aebb8efbe7886b0c937",
        "Pinned builder differs from the main builder captured for this package",
    )

    cathedral_semantic = QA / "pisa-cathedral-ground-plan-strict/classified-source-pixels.png"
    _, cathedral_walls, _ = semantic_masks(cathedral_semantic)
    restored = int(np.count_nonzero(cathedral_walls[410:705, 350:504]))
    assert_true(restored == 1948, f"Cathedral audited wall count changed: {restored}")
    checks["pisa-cathedral"] = {
        "sourcePixelSubset": derivation["pisa-cathedral"]["sourceSubset"],
        "restoredAuditedWallPixels": restored,
        "unlocated": ["西立面停点", "圣拉涅利门停点", "后期重组讲坛", "地下室", "屋顶", "楼廊", "服务层"],
    }

    bapt_semantic = QA / "pisa-baptistery-ground-plan-strict/classified-source-pixels.png"
    _, bapt_walls, bapt_details = semantic_masks(bapt_semantic)
    yy, xx = np.ogrid[: bapt_walls.shape[0], : bapt_walls.shape[1]]
    x1, y1, x2, y2 = 19, 583, 888, 350
    distance = np.abs((y2 - y1) * xx - (x2 - x1) * yy + x2 * y1 - y2 * x1) / np.hypot(y2 - y1, x2 - x1)
    section_selected = int(np.count_nonzero((bapt_walls | bapt_details) & (distance <= 8)))
    assert_true(section_selected == 0, "Baptistery A-A section ink remains in semantic output")
    assert_true(derivation["pisa-baptistery"]["outerEnvelopePixelsRetained"] >= 4500, "Baptistery outer envelope is incomplete")
    checks["pisa-baptistery"] = {
        "sourcePixelSubset": derivation["pisa-baptistery"]["sourceSubset"],
        "sectionCorridorPixelsInOutput": section_selected,
        "outerEnvelopePixelsRetained": derivation["pisa-baptistery"]["outerEnvelopePixelsRetained"],
        "upperLayerUnchangedSha256": digest(DERIVED / "pisa-baptistery-first-floor-source-pixels-v2.pdf"),
        "unlocated": ["两条螺旋梯的井道与上下落点", "女性楼廊独立地板填充与中央挑空边界", "当前开放及疏散路线"],
    }

    camposanto_semantic = QA / "camposanto-ground-plan-strict/classified-source-pixels.png"
    camposanto_rgb, camposanto_walls, camposanto_details = semantic_masks(camposanto_semantic)
    target_windows = derivation["camposanto"]["targetWindows"]
    target_pixels = 0
    for x0, y0, x1, y1 in target_windows:
        target_pixels += int(np.count_nonzero((camposanto_walls | camposanto_details)[y0:y1, x0:x1]))
    assert_true(target_pixels == 0, "Camposanto survey target windows still emit geometry")
    assert_true(derivation["camposanto"]["supportProfilesDetected"] == 55, "Camposanto support inventory changed")
    assert_true(np.count_nonzero(camposanto_walls) > 70000, "Camposanto structural walls unexpectedly sparse")
    assert_true(np.count_nonzero(camposanto_details) > 150000, "Camposanto flat survey detail unexpectedly sparse")
    checks["camposanto"] = {
        "sourcePixelSubset": derivation["camposanto"]["sourceSubset"],
        "surveyTargetsExcluded": len(target_windows),
        "targetWindowPixelsInOutput": target_pixels,
        "actualSupportProfiles": derivation["camposanto"]["supportProfilesDetected"],
        "wallPixels": int(np.count_nonzero(camposanto_walls)),
        "flatDetailPixels": int(np.count_nonzero(camposanto_details)),
        "unlocated": ["罗马石棺逐件位置", "地方纪念物逐件位置", "单幅壁画边界", "屋顶与不可进入服务层", "当前参观流线"],
    }

    opera_semantic = QA / "opera-pisa-ground-plan-strict/classified-source-pixels.png"
    _, opera_walls, opera_details = semantic_masks(opera_semantic)
    detail_windows = {
        "西北楼梯与门弧": (850, 650, 1045, 780),
        "北翼楼梯与坡道": (1060, 455, 1320, 620),
        "东翼楼梯与门弧": (1500, 760, 1705, 930),
        "南侧回廊踏步与跨间线": (170, 1080, 1100, 1280),
    }
    detail_counts = {
        label: int(np.count_nonzero(opera_details[y0:y1, x0:x1]))
        for label, (x0, y0, x1, y1) in detail_windows.items()
    }
    for label, count in detail_counts.items():
        assert_true(count >= 250, f"Opera detail regression in {label}: {count}")
    assert_true(np.count_nonzero(opera_walls) > 90000, "Opera structural wall layer unexpectedly sparse")
    checks["opera-pisa"] = {
        "sourcePixelSubset": derivation["opera-pisa"]["sourceSubset"],
        "wallPixels": int(np.count_nonzero(opera_walls)),
        "flatDetailPixels": int(np.count_nonzero(opera_details)),
        "reviewedDetailWindowPixels": detail_counts,
        "unlocated": ["上层完整正投影与分隔", "上层楼梯和电梯落点", "现行藏品展厅位置", "当前参观流线"],
    }

    tower = json.loads((MODELS / "leaning-tower.json").read_text())
    tower_place_labels = [place["label"] for place in tower["places"]]
    tower_links = [link["id"] for link in tower.get("verticalLinks", [])]
    tower_stops = [binding["stopIndex"] for binding in tower["stopBindings"]]
    assert_true("外部柱廊" not in tower_place_labels, "Unsupported Tower exterior arcade place remains")
    assert_true("entry-to-lower-galleries" not in tower_links, "Duplicate first-gallery cross-sheet link remains")
    assert_true(tower_stops == [2, 3], f"Tower bindings changed: {tower_stops}")
    assert_true(all(link["kind"] in {"stairs", "elevator"} and link["label"].strip() for link in tower.get("verticalLinks", [])), "Tower vertical-link contract failed")
    checks["leaning-tower"] = {
        "sourcePixelSubset": derivation["leaning-tower-base"]["sourceSubset"],
        "sourcePlanGroups": 5,
        "actualIndependentEightFloorplatesClaimed": False,
        "stopBindings": tower_stops,
        "verticalLinks": tower_links,
        "removedUnsupportedPlace": "外部柱廊",
        "removedDuplicateSourceLink": "entry-to-lower-galleries",
        "unlocated": ["入口浮雕精确墙位", "外部柱廊停点的精确地面锚点", "顶部环台", "四个被注记遮挡的柱位", "当前开放与单向通行"],
    }

    contacts = []
    strict_contacts = [
        ("pisa-cathedral-ground", "pisa-cathedral", "ground", (504, 717), QA / "pisa-cathedral-ground-plan-strict/authoritative-source-crop.png", cathedral_semantic),
        ("pisa-baptistery-ground", "pisa-baptistery", "ground", (895, 898), QA / "pisa-baptistery-ground-plan-strict/authoritative-source-crop.png", bapt_semantic),
        ("camposanto-ground", "camposanto", "ground", (2000, 780), QA / "camposanto-ground-plan-strict/authoritative-source-crop.png", camposanto_semantic),
        ("opera-pisa-ground", "opera-pisa", "ground", (1828, 1560), QA / "opera-pisa-ground-plan-strict/authoritative-source-crop.png", opera_semantic),
        ("leaning-tower-base", "leaning-tower", "base", (592, 616), QA / "leaning-tower-base-plan-strict/authoritative-source-crop.png", QA / "leaning-tower-base-plan-strict/classified-source-pixels.png"),
    ]
    for name, slug, floor_id, size, source, semantic in strict_contacts:
        model_render = render_floor(slug, floor_id, size)
        contacts.append(str(contact_sheet(name, source, semantic, model_render).relative_to(ROOT)))

    tower_contacts = [
        (
            "leaning-tower-entry-first",
            "entry-first",
            (910, 1000),
            QA / "tower-source-pixels/leaning-tower-goodyear-entry-first-source-pixels-source.png",
            QA / "tower-source-pixels/leaning-tower-goodyear-entry-first-source-pixels.png",
        ),
        (
            "leaning-tower-galleries-1-3",
            "galleries-1-3",
            (915, 1005),
            QA / "tower-source-pixels/leaning-tower-goodyear-galleries-1-3-source-pixels-source.png",
            QA / "tower-source-pixels/leaning-tower-goodyear-galleries-1-3-source-pixels.png",
        ),
        (
            "leaning-tower-galleries-4-7",
            "galleries-4-7",
            (915, 985),
            QA / "tower-v4/leaning-tower-goodyear-1071-crop.png",
            QA / "tower-v4/leaning-tower-goodyear-galleries-4-7-v4.png",
        ),
        (
            "leaning-tower-upper",
            "upper",
            (915, 1005),
            QA / "tower-source-pixels/leaning-tower-goodyear-upper-source-pixels-source.png",
            QA / "tower-source-pixels/leaning-tower-goodyear-upper-source-pixels.png",
        ),
    ]
    for name, floor_id, size, source, semantic in tower_contacts:
        model_render = render_floor("leaning-tower", floor_id, size)
        contacts.append(str(contact_sheet(name, source, semantic, model_render).relative_to(ROOT)))

    prior_validation = REPORTS / "strict-five-validation.json"
    deterministic = None
    if not replay and prior_validation.exists():
        deterministic = json.loads(prior_validation.read_text()).get("determinism")
    if replay:
        first = run_replay()
        second = run_replay()
        assert_true(first == second, "Two replay passes produced different hashes")
        deterministic = {"passes": 2, "identical": True, "hashes": second}

    result = {
        "status": "pass",
        "builderSha256": builder_hash,
        "checks": checks,
        "contacts": contacts,
        "determinism": deterministic,
    }
    REPORTS.mkdir(parents=True, exist_ok=True)
    (REPORTS / "strict-five-validation.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    )
    return result


def write_package_manifest(validation: dict) -> dict:
    files = []
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file() or path.name == "package-manifest.json":
            continue
        files.append(
            {
                "path": str(path.relative_to(ROOT)),
                "sha256": digest(path),
                "bytes": path.stat().st_size,
            }
        )
    manifest = {
        "package": "pisa-strict-five-v2-native",
        "status": validation["status"],
        "builderSha256": validation["builderSha256"],
        "venues": ["leaning-tower", "pisa-cathedral", "pisa-baptistery", "camposanto", "opera-pisa"],
        "files": files,
    }
    path = REPORTS / "package-manifest.json"
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--replay", action="store_true")
    parser.add_argument("--write-manifest", action="store_true")
    args = parser.parse_args()
    validation = validate(args.replay)
    output = {"validation": validation}
    if args.write_manifest:
        manifest = write_package_manifest(validation)
        output["packageFiles"] = len(manifest["files"])
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
