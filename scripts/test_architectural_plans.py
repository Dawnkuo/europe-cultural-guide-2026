"""Geometry regressions: exact holes, one-pixel lines, and generated validity."""
import importlib.util
import hashlib
import json
import unittest
from pathlib import Path
from PIL import Image
from architectural_preview import paint_polygon

import numpy as np
import fitz
from shapely.geometry import LineString, Point, Polygon
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("plan_builder", ROOT / "scripts/build-architectural-plans.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class ArchitecturalGeometryTest(unittest.TestCase):
    def test_profile_selection_rejects_invented_or_duplicate_indices(self):
        drawings = [{"items": [("re", fitz.Rect(0, 0, 5, 5), 1)]},
                    {"items": [("re", fitz.Rect(10, 0, 12, 2), 1)]}]
        spec = {"ids": [0, 1], "endpointGrid": .01, "expectedAreas": [25, 4], "profileIndices": [1]}
        profiles = builder.closed_wall_profiles(drawings, spec)
        self.assertEqual([p.area for p in profiles], [4])
        for indices in ([], [1,1], [-1], [2], [True]):
            with self.assertRaisesRegex(ValueError, "Invalid reviewed"):
                builder.closed_wall_profiles(drawings, {**spec, "profileIndices": indices})

    def test_sforza_places_follow_native_plan_not_pdf_display_rotation(self):
        model = json.loads((ROOT / "app/data/architectural-plans/sforza.json").read_text())
        points = {p["label"]: p["at"] for p in model["places"]}
        self.assertEqual(points["菲拉雷特塔入口轴线"], [143.8,92.5])
        self.assertEqual(points["罗凯塔庭院"], [59,122])
        self.assertEqual(points["公爵庭院"], [59,71])
        self.assertEqual(points["武器广场庭院"], [112,94])

    def test_koln_native_core_and_curved_facades_are_preserved(self):
        model = json.loads((ROOT / "app/data/architectural-plans/koln-triangle.json").read_text())
        self.assertFalse(any(s["floorId"] == "ground" for s in model["spaces"]))
        ground = next(f for f in model["floors"] if f["id"] == "ground")
        self.assertGreaterEqual(sum(f["kind"] == "wall" for f in ground["features"]), 100)
        for space in model["spaces"]:
            self.assertEqual(space["scope"], "floor")
            self.assertGreater(len(space["polygons"][0]["outer"]), 40)

    def test_galleria_profiles_do_not_fill_the_arcade_or_closed_shop(self):
        model = json.loads((ROOT / "app/data/architectural-plans/galleria-vittorio.json").read_text())
        floor = model["floors"][0]
        walls = [f for f in floor["features"] if f["kind"] == "wall"]
        self.assertEqual(len(walls), 314)
        self.assertGreater(sum(f["kind"] == "detail" for f in floor["features"]), 14000)
        shape = unary_union([Polygon(p["outer"], p["holes"]) for f in walls for p in f["polygons"]])
        self.assertFalse(shape.covers(Point(889-230,416-85)))
        self.assertFalse(shape.covers(Point(393-230,490-85)))

    def test_extended_pdf_operations_keep_native_indices_and_channel_clips(self):
        rectangle = {"items": [("re", fitz.Rect(0, 0, 10, 10), 1)], "type": "fs", "seqno": 4}
        line = {"items": [("l", fitz.Point(0, 2), fitz.Point(10, 2))], "type": "s", "seqno": 7}
        class Page:
            rect = fitz.Rect(0, 0, 10, 10)
            def get_drawings(self, extended=False):
                if not extended:
                    return [rectangle, line]
                return [
                    {**rectangle, "type": "f", "level": 0},
                    {"type": "clip", "level": 0, "items": [("re", fitz.Rect(0, 0, 4, 10), 1)]},
                    {**rectangle, "type": "s", "seqno": 6, "level": 1},
                    {**line, "level": 0},
                ]
        drawings = list(builder.visible_drawings(Page()))
        self.assertEqual([index for index, _, _ in drawings], [0, 1])
        self.assertEqual(drawings[0][1]["type"], "fs")
        self.assertEqual(drawings[0][1]["channelClips"]["fill"].area, 100)
        self.assertEqual(drawings[0][1]["channelClips"]["stroke"].area, 40)
        self.assertEqual(drawings[1][2].area, 100)

    def test_uffizi_second_floor_keeps_native_fill_path_1125(self):
        document = fitz.open(ROOT / "sources/floorplans/uffizi-2026.pdf")
        page = document[1]
        native = page.get_drawings()
        visible = list(builder.visible_drawings(page))
        self.assertEqual(len(native), len(visible))
        for index, drawing, _ in visible:
            self.assertEqual(drawing["seqno"], native[index]["seqno"])
            self.assertEqual(drawing["items"], native[index]["items"])
        self.assertEqual(visible[1125][1]["type"], "f")
        self.assertEqual(visible[1125][1]["rect"], native[1125]["rect"])
        document.close()

    def test_source_clipping_never_closes_an_open_contour(self):
        drawing = {"items": [("re", fitz.Rect(1, 1, 4, 4), 1)]}
        self.assertAlmostEqual(builder.closed_source_region([drawing], [0]).area, 9)
        drawing = {"items": [("l", fitz.Point(1, 1), fitz.Point(4, 1)),
                             ("l", fitz.Point(4, 1), fitz.Point(4, 4))]}
        with self.assertRaisesRegex(ValueError, "explicitly closed"):
            builder.closed_source_region([drawing], [0])

    def test_doge_upper_floor_has_no_lower_floor_context_slab(self):
        model = json.loads((ROOT / "app/data/architectural-plans/doges-palace.json").read_text())
        floor = next(f for f in model["floors"] if f["id"] == "L1")
        feature = next(f for f in floor["features"] if f["id"] == "L1-path-61-surface")
        shape = unary_union([Polygon(p["outer"], p["holes"]) for p in feature["polygons"]])
        self.assertFalse(shape.covers(Point(295 - 197, 620 - 469)))
        self.assertTrue(shape.covers(Point(363 - 197, 510 - 469)))

    def test_doge_loggia_removes_ghost_but_keeps_real_colonnades(self):
        model = json.loads((ROOT / "app/data/architectural-plans/doges-palace.json").read_text())
        floor = next(f for f in model["floors"] if f["id"] == "loggia")
        feature = next(f for f in floor["features"] if f["id"] == "loggia-path-63-surface")
        shape = unary_union([Polygon(p["outer"], p["holes"]) for p in feature["polygons"]])
        for point in [(218, 640), (260, 720)]:
            self.assertFalse(shape.covers(Point(point[0] - 177, point[1] - 453)))
        for point in [(260, 606), (425, 650), (320, 747)]:
            self.assertTrue(shape.covers(Point(point[0] - 177, point[1] - 453)))

    def test_doge_service_locations_follow_inside_leader_endpoints(self):
        model = json.loads((ROOT / "app/data/architectural-plans/doges-palace.json").read_text())
        config = json.loads((ROOT / "sources/floorplans/venues/doges-palace.json").read_text())
        document = fitz.open(ROOT / "sources/floorplans/doges-palace-2025.pdf")
        places = {p["id"]: p for p in model["places"]}
        floors = {f["id"]: f for f in config["floors"]}
        for floor_id, slug, path, endpoint in [
            ("L0", "lift", 186, 1), ("L0", "cafe", 157, 1),
            ("L0", "cloakroom", 178, 1), ("L0", "toilets", 180, 1),
            ("L0", "accessible-wc", 195, 1), ("L0", "bookshop", 182, 2),
            ("L0", "tickets", 184, 2), ("loggia", "lift", 178, 1),
            ("loggia", "bookshop", 173, 1), ("loggia", "toilets", 213, 2),
            ("L1", "lift", 283, 1), ("L2", "lift", 155, 1), ("attic", "lift", 64, 1),
        ]:
            floor = floors[floor_id]
            point = document[floor["page"] - 1].get_drawings()[path]["items"][0][endpoint]
            for actual, source, origin in zip(places[f"{floor_id}-{slug}-1"]["at"], point, floor["crop"]):
                self.assertAlmostEqual(actual, source - origin, places=3)
        self.assertEqual(sum(link["kind"] == "elevator" for link in model["verticalLinks"]), 4)
        document.close()

    def test_picasso_keeps_gallery_numbers_services_and_each_evidenced_connection(self):
        model = json.loads((ROOT / "app/data/architectural-plans/picasso-barcelona.json").read_text())
        upper = {p["label"] for p in model["places"] if p["floorId"] == "L1"}
        self.assertTrue({str(i) for i in range(1, 17)} | {"B1", "B2"} <= upper)
        ground = {p["label"] for p in model["places"] if p["floorId"] == "L0"}
        self.assertTrue({"女卫生间", "男卫生间", "无障碍卫生间", "团队接待", "书店", "寄存"} <= ground)
        places = {p["id"]: p for p in model["places"]}
        expected_links = {"meca-stairs", "aguilar-stairs", "finestres-stairs", "collection-lift", "temporary-lift"}
        self.assertEqual({link["id"] for link in model["verticalLinks"]}, expected_links)
        for link in model["verticalLinks"]:
            self.assertEqual(places[link["fromPlaceId"]]["floorId"], "L0")
            self.assertEqual(places[link["toPlaceId"]]["floorId"], "L1")
        shapes = [unary_union([Polygon(p["outer"], p["holes"]) for p in s["polygons"]])
                  for s in model["spaces"] if s["floorId"] == "L1"]
        for binding in model["stopBindings"]:
            place = places[binding["placeId"]]
            if place["floorId"] == "L1":
                self.assertTrue(any(shape.covers(Point(place["at"])) for shape in shapes), place["id"])

    def test_st_peters_preserves_all_source_number_occurrences(self):
        model = json.loads((ROOT / "app/data/architectural-plans/st-peters-basilica.json").read_text())
        for floor, maximum, occurrences in (("basilica", 84, 86), ("grottoes", 68, 70)):
            places = [p for p in model["places"] if p["floorId"] == floor]
            expected = {str(i) for i in range(1, maximum + 1)} - ({"82"} if floor == "basilica" else set())
            self.assertEqual({p["label"] for p in places}, expected)
            self.assertEqual(len(places), occurrences)
        self.assertEqual(len({p["id"] for p in model["places"]}), 156)
        self.assertEqual([p["label"] for p in model["unlocatedPlaces"]], ["82"])
        self.assertEqual(len([p for p in model["places"] if p["floorId"] == "basilica" and p["label"] == "79"]), 4)

    def test_correr_services_follow_leaders_into_the_building(self):
        model = json.loads((ROOT / "app/data/architectural-plans/correr.json").read_text())
        document = fitz.open(ROOT / "sources/floorplans/correr.pdf")
        drawings = document[0].get_drawings()
        for label, source_id in {"售票": 195, "商店": 193, "咖啡馆": 197,
                                 "寄存": 169, "无障碍电梯": 167, "卫生间": 229}.items():
            place = next(p for p in model["places"] if p["id"] == f"L1-{label}-1")
            endpoint = drawings[source_id]["items"][0][2]
            for actual, target in zip(place["at"], (endpoint.x - 684, endpoint.y - 421)):
                self.assertAlmostEqual(actual, target, places=3, msg=label)
        toilet = next(s for s in model["spaces"] if s["placeId"] == "L1-卫生间-1")
        footprint = unary_union([Polygon(p["outer"], p["holes"]) for p in toilet["polygons"]])
        self.assertTrue(footprint.contains(Point(882.944519 - 684, 498.186188 - 421)))
        self.assertFalse(footprint.contains(Point(883.083466 - 684, 546.011017 - 421)))
        document.close()

    def test_pdf_stroke_dashes_preserve_gaps_phase_and_subpath_restarts(self):
        drawing = {"items": [("l", fitz.Point(0, 0), fitz.Point(12, 0)),
                             ("l", fitz.Point(0, 4), fitz.Point(12, 4))],
                   "width": 1, "dashes": "[ 2 3 ] 1", "lineCap": (0, 0, 0)}
        shape = builder.stroke_geometry(drawing)
        for y in (0, 4):
            for x in (0.5, 4.5, 9.5):
                self.assertTrue(shape.covers(Point(x, y)))
            for x in (1.5, 6.5, 11.5):
                self.assertFalse(shape.covers(Point(x, y)))
        self.assertAlmostEqual(shape.area, 10)

    def test_pdf_odd_dash_array_and_round_dots(self):
        drawing = {"items": [("l", fitz.Point(0, 0), fitz.Point(10, 0))],
                   "width": 0.5, "dashes": "[2] 0", "lineCap": (0, 0, 0)}
        shape = builder.stroke_geometry(drawing)
        self.assertTrue(shape.covers(Point(5, 0)))
        self.assertFalse(shape.covers(Point(3, 0)))
        drawing.update(dashes="[0 2] 0", lineCap=(1, 1, 1))
        dots = builder.stroke_geometry(drawing)
        self.assertTrue(dots.covers(Point(2, 0)))
        self.assertFalse(dots.covers(Point(1, 0)))
        drawing["dashes"] = "[0 0] 0"
        with self.assertRaisesRegex(ValueError, "Invalid PDF dash"):
            builder.stroke_geometry(drawing)

    def test_uffizi_ground_portico_keeps_each_source_column_and_open_courtyard(self):
        model = json.loads((ROOT / "app/data/architectural-plans/uffizi.json").read_text())
        floor = next(f for f in model["floors"] if f["id"] == "L0")
        features = {f["id"]: f for f in floor["features"]}
        document = fitz.open(ROOT / "sources/floorplans/uffizi-2026.pdf")
        drawings = document[0].get_drawings()
        for source_id in [*range(65, 71), *range(74, 139)]:
            feature = features[f"L0-path-{source_id}-wall"]
            shape = unary_union([Polygon(p["outer"], p["holes"]) for p in feature["polygons"]])
            rect = drawings[source_id]["rect"]
            expected = (rect.x0 - 282, rect.y0 - 766, rect.x1 - 282, rect.y1 - 766)
            for actual, target in zip(shape.bounds, expected):
                self.assertAlmostEqual(actual, target, places=3, msg=f"Source column {source_id}")
            self.assertTrue(shape.is_valid)
        document.close()
        walls = unary_union([Polygon(p["outer"], p["holes"]) for f in floor["features"]
                             if f["kind"] == "wall" for p in f["polygons"]])
        self.assertFalse(walls.covers(Point(460 - 282, 896 - 766)), "Courtyard must remain open")
        self.assertFalse(walls.covers(Point(606 - 282, 896 - 766)), "Entrance axis must not be bridged")

    def test_barcelona_selection_spaces_do_not_become_new_building_surfaces(self):
        model = json.loads((ROOT / "app/data/architectural-plans/barcelona-cathedral.json").read_text())
        selected = [space for space in model["spaces"] if space.get("featureIds") == []]
        self.assertEqual(len(selected), 55)
        self.assertEqual(len(model["floors"][0]["features"]), 1652)
        self.assertFalse(any("selection" in feature["id"] for feature in model["floors"][0]["features"]))
        shapes = [(space["id"], unary_union([Polygon(p["outer"], p["holes"]) for p in space["polygons"]]))
                  for space in selected]
        numbered = [place for place in model["places"] if place["label"].isdigit()]
        self.assertEqual(len(numbered), 59)
        groups = {}
        for place in numbered:
            matches = [id_ for id_, shape in shapes if shape.covers(Point(place["at"]))]
            if place["label"] == "26":
                self.assertEqual(matches, [], "Exterior portal must not acquire an indoor room")
            else:
                self.assertEqual(len(matches), 1, place["label"])
                groups[place["label"]] = matches[0]
        self.assertEqual(groups["2"], groups["13"])
        self.assertEqual(groups["13"], groups["24"])
        self.assertEqual(groups["71"], groups["72"])
        self.assertNotEqual(groups["5"], groups["6"])

    def test_cologne_section_label_cleanup_preserves_intersecting_walls(self):
        model = json.loads((ROOT / "app/data/architectural-plans/cologne-cathedral.json").read_text())
        floor = next(f for f in model["floors"] if f["id"] == "south-tower-access-2009")
        ink = unary_union([Polygon(p["outer"], p["holes"])
                           for feature in floor["features"] for p in feature["polygons"]])
        for source_y in (390, 406):
            self.assertTrue(ink.covers(Point(283 - 52, source_y)), "A-A cleanup cut through source wall")
        self.assertGreater(ink.distance(Point(283 - 52, 100)), 10)
        self.assertGreater(ink.distance(Point(283 - 52, 350)), 8)

    def test_borghese_room_faces_exclude_north_services_and_respect_upper_dividers(self):
        model = json.loads((ROOT / "app/data/architectural-plans/borghese.json").read_text())
        spaces = {s["id"]: unary_union([Polygon(p["outer"], p["holes"]) for p in s["polygons"]])
                  for s in model["spaces"]}
        chapel = spaces["P0-room-C"]
        self.assertAlmostEqual(chapel.bounds[1], 450.4 - 430)
        self.assertFalse(chapel.covers(Point(80, 12)), "North lift/stair is not the chapel")
        for top, bottom in (("19", "20"), ("9", "10")):
            upper = spaces[f"P1-room-{top}"]
            lower = spaces[f"P1-room-{bottom}"]
            self.assertAlmostEqual(upper.bounds[3], 489.2 - 430)
            self.assertAlmostEqual(lower.bounds[1], 490 - 430)
            self.assertAlmostEqual(upper.intersection(lower).area, 0)
        for floor in model["floors"]:
            shapes = [spaces[s["id"]] for s in model["spaces"] if s["floorId"] == floor["id"]]
            for index, shape in enumerate(shapes):
                for other in shapes[index + 1:]:
                    self.assertAlmostEqual(shape.intersection(other).area, 0)

    def test_brera_selection_preserves_all_numbered_areas_without_invented_partition(self):
        model = json.loads((ROOT / "app/data/architectural-plans/brera.json").read_text())
        rooms = [p for p in model["places"] if p["kind"] == "room"]
        spaces = {s["id"]: unary_union([Polygon(p["outer"], p["holes"]) for p in s["polygons"]])
                  for s in model["spaces"]}
        self.assertEqual(len(rooms), 35)
        self.assertEqual(len(spaces), 34)
        for room in rooms:
            matches = [id_ for id_, shape in spaces.items() if shape.contains(Point(room["at"]))]
            expected = "gallery-room-1-6" if room["label"] in {"1", "6"} else f"gallery-room-{room['label']}"
            self.assertEqual(matches, [expected], room["label"])
        for i, shape in enumerate(spaces.values()):
            self.assertTrue(shape.is_valid)
            self.assertEqual(len(shape.interiors), 0, "Text residue must not become floor holes")
            for other in list(spaces.values())[i + 1:]:
                self.assertAlmostEqual(shape.intersection(other).area, 0)

    def test_brera_text_masks_do_not_erase_partitions_or_extrude_artwork_badges(self):
        model = json.loads((ROOT / "app/data/architectural-plans/brera.json").read_text())
        walls = unary_union([Polygon(p["outer"], p["holes"])
                             for feature in model["floors"][0]["features"] if feature["kind"] == "wall"
                             for p in feature["polygons"]])
        for x, y in [(307, 220.3), (584, 304.7), (391.4, 166.8), (586.3, 481.5)]:
            self.assertTrue(walls.contains(Point(x - 164, y - 35)))
        for x, y in [(495.6, 448.5), (511.6, 462)]:
            self.assertGreater(walls.distance(Point(x - 164, y - 35)), 7)

    def test_pixel_tracing_rejects_unsigned_subtraction_overflow(self):
        for mask in (np.array([[0, 255, 1]], dtype=np.uint8), np.array([[0, 2, 1]])):
            with self.assertRaisesRegex(ValueError, "binary source mask"):
                builder.trace_pixel_ink(mask)

    def test_even_wall_kernels_never_create_pixels_or_bridge_empty_space(self):
        rgb = np.full((40, 80, 3), 255, dtype=np.uint8)
        rgb[5:30, 5:15] = 0
        rgb[10:35, 60:72] = 0
        rgb[8, 15:25] = 0
        source = np.max(rgb, axis=2) == 0
        expected = builder.trace_pixel_ink(source, tolerance=0)
        with fitz.open() as document:
            page = document.new_page(width=80, height=40)
            xref = page.insert_image(page.rect, pixmap=fitz.Pixmap(fitz.csRGB, 80, 40, rgb.tobytes(), False))
            for kernel in (2, 3, 4, 6):
                layers = list(builder.raster_geometry(document, page, {
                    "xref": xref, "maxChannel": 100, "wallKernel": kernel,
                    "tolerancePixels": 0, "minAreaPixels": 0,
                }))
                actual = unary_union([geometry for _, _, geometry in layers])
                self.assertAlmostEqual(actual.symmetric_difference(expected).area, 0, msg=f"kernel {kernel}")
                self.assertFalse(actual.covers(Point(40, 20)), f"kernel {kernel}")
                for _, _, geometry in layers:
                    self.assertAlmostEqual(geometry.difference(expected).area, 0)

    def test_preview_holes_preserve_earlier_stairs_and_walls(self):
        image = Image.new("RGB", (100, 100), "white")
        paint_polygon(image, [(20, 45), (80, 45), (80, 48), (20, 48)], [], "gray")
        paint_polygon(image, [(10, 10), (90, 10), (90, 90), (10, 90)],
                      [[(15, 15), (85, 15), (85, 85), (15, 85)]], "black")
        self.assertEqual(image.getpixel((50, 46)), (128, 128, 128))
        self.assertEqual(image.getpixel((12, 50)), (0, 0, 0))
        self.assertEqual(image.getpixel((50, 60)), (255, 255, 255))

    def test_doge_source_checkpoints_preserve_walls_treads_and_door_gaps(self):
        self.assert_source_checkpoints("doges-palace")

    def test_accademia_source_checkpoints_preserve_walls_treads_and_door_gaps(self):
        self.assert_source_checkpoints("accademia-venice")

    def test_cenacolo_source_walls_artwork_bars_and_entrances(self):
        self.assert_source_checkpoints("last-supper")

    def test_pantheon_source_faces_preserve_chapel_angles_and_empty_cella(self):
        model = json.loads((ROOT / "app/data/architectural-plans/pantheon.json").read_text())
        floor = model["floors"][0]
        ink = unary_union([Polygon(p["outer"], p["holes"])
                           for f in floor["features"] if f["kind"] != "surface"
                           for p in f["polygons"]])
        spaces = {s["id"]: unary_union([Polygon(p["outer"], p["holes"]) for p in s["polygons"]])
                  for s in model["spaces"]}
        self.assertEqual(len(spaces), 8)
        # Source PDF points, translated by the plan crop only. These interior
        # samples used to be crossed by unsigned-underflow scanline artefacts.
        for x, y in [(165, 235), (190, 250), (220, 300)]:
            point = Point(x, y - 84.6667)
            self.assertGreater(ink.distance(point), 10)
            self.assertTrue(spaces["L0-cella"].covers(point))
        self.assertEqual(len(spaces["L0-portico"].geoms), 3)
        chapel = spaces["L0-crucifixion"]
        self.assertLess(chapel.area, chapel.envelope.area * .7)
        self.assertTrue(chapel.covers(Point(88, 177 - 84.6667)))
        self.assertFalse(chapel.covers(Point(68, 155 - 84.6667)))

    def assert_source_checkpoints(self, slug):
        review = json.loads((ROOT / f"sources/floorplans/rebuild-reports/{slug}-geometry-checkpoints.json").read_text())
        model = json.loads((ROOT / f"app/data/architectural-plans/{slug}.json").read_text())
        self.assertEqual(hashlib.sha256((ROOT / review["source"]["file"]).read_bytes()).hexdigest(), review["source"]["sha256"])
        for floor_id, checks in review["floors"].items():
            floor = next(f for f in model["floors"] if f["id"] == floor_id)
            layers = {kind: unary_union([
                Polygon(ring["outer"], ring["holes"])
                for feature in floor["features"] if feature["kind"] == kind
                for ring in feature["polygons"]
            ]) for kind in ("wall", "detail")}
            x0, y0 = checks["crop"][:2]
            details = checks.get("expectedStairTreads", checks.get("expectedDetails", []))
            self.assertTrue(details)
            for check_kind, checkpoints in (("wall", checks["expectedWalls"]), ("detail", details)):
                for checkpoint in checkpoints:
                    point = Point(checkpoint["point"][0] - x0, checkpoint["point"][1] - y0)
                    self.assertLessEqual(layers[check_kind].distance(point), .005, checkpoint["id"])
                    if check_kind == "detail":
                        self.assertFalse(layers["wall"].covers(point), checkpoint["id"])
            ink = layers["wall"].union(layers["detail"])
            for checkpoint in checks["expectedDoorGaps"]:
                point = Point(checkpoint["point"][0] - x0, checkpoint["point"][1] - y0)
                self.assertGreaterEqual(ink.distance(point), checkpoint["minClearance"] - .005, checkpoint["id"])

    def test_reviewed_raster_channels_are_explicit_and_validated(self):
        self.assertEqual(builder.reviewed_raster_kind({}, "wall"), "wall")
        self.assertIsNone(builder.reviewed_raster_kind({"includeKinds": ["wall"]}, "detail"))
        self.assertEqual(builder.reviewed_raster_kind({"kindMap": {"detail": "surface"}}, "detail"), "surface")
        for spec in ({"includeKinds": "wall"}, {"includeKinds": []},
                     {"includeKinds": ["walls"]}, {"kindMap": {"detail": "floor"}}):
            with self.assertRaises(ValueError):
                builder.reviewed_raster_kind(spec, "wall")

    def test_neutral_ink_filter_keeps_dark_and_light_walls_not_red_callouts(self):
        rgb = np.full((30, 60, 3), 255, dtype=np.uint8)
        rgb[5:25, 5:10] = 0
        rgb[5:25, 15:20] = 220
        rgb[5:25, 25:30] = [190, 20, 20]
        rgb[5:25, 35:40] = [95, 5, 5]
        with fitz.open() as document:
            page = document.new_page(width=60, height=30)
            pixmap = fitz.Pixmap(fitz.csRGB, 60, 30, rgb.tobytes(), False)
            xref = page.insert_image(page.rect, pixmap=pixmap)
            spec = {"xref": xref, "maxChannel": 235, "maxChroma": 12,
                    "wallKernel": 1, "tolerancePixels": 0}
            layers = list(builder.raster_geometry(document, page, spec))
            ink = unary_union([geometry for _, _, geometry in layers])
            self.assertTrue(ink.covers(Point(7, 15)))
            self.assertTrue(ink.covers(Point(17, 15)))
            self.assertFalse(ink.covers(Point(27, 15)))
            self.assertFalse(ink.covers(Point(37, 15)))
            self.assertAlmostEqual(ink.area, 200)

    def test_flat_step_region_keeps_ink_without_extruding_it(self):
        rgb = np.full((30, 30, 3), 255, dtype=np.uint8)
        rgb[2:28, 2:5] = 0
        rgb[10:12, 12:25] = 0
        with fitz.open() as document:
            page = document.new_page(width=30, height=30)
            xref = page.insert_image(page.rect, pixmap=fitz.Pixmap(fitz.csRGB, 30, 30, rgb.tobytes(), False))
            spec = {"xref": xref, "maxChannel": 100, "wallKernel": 1,
                    "tolerancePixels": 0, "flatRects": [{"rect": [10, 8, 27, 14]}]}
            layers = list(builder.raster_geometry(document, page, spec))
            walls = unary_union([geometry for kind, _, geometry in layers if kind == "wall"])
            details = unary_union([geometry for kind, _, geometry in layers if kind == "detail"])
            self.assertTrue(walls.covers(Point(3, 15)))
            self.assertFalse(walls.covers(Point(15, 11)))
            self.assertTrue(details.covers(Point(15, 11)))
            self.assertAlmostEqual(walls.union(details).area, 104)

    def test_coordinate_quantization_preserves_valid_topology(self):
        shape = Polygon([(0, 0), (5, 0), (5, 5), (2.000049, 5),
                         (2.000049, 1), (2.000041, 1), (2.000041, 5), (0, 5)])
        rings = builder.polygons(shape, [0, 0])
        self.assertTrue(rings)
        for ring in rings:
            self.assertTrue(Polygon(ring["outer"], ring["holes"]).is_valid)
        self.assertLess(abs(sum(Polygon(p["outer"], p["holes"]).area for p in rings) - shape.area), .001)

    def test_source_projection_requires_review_of_every_page(self):
        config = {"floors":[{"page":1},{"page":2}], "sourceProjection":{
            "kind":"orthographic", "pages":[1,2],
            "basis":"Both reviewed source pages show overhead floor plans without perspective."}}
        builder.validate_projection(config)
        for kind in ("unknown", "oblique", "perspective"):
            with self.assertRaisesRegex(ValueError, "rectify"):
                builder.validate_projection({**config,"sourceProjection":{**config["sourceProjection"],"kind":kind}})
        with self.assertRaisesRegex(ValueError, "every extracted page"):
            builder.validate_projection({**config,"sourceProjection":{**config["sourceProjection"],"pages":[1]}})
        with self.assertRaisesRegex(ValueError, "rectify"):
            builder.validate_projection({"floors":[{"page":1}]})

    def test_wall_profile_does_not_bridge_open_contours(self):
        drawing = {"items":[("l",fitz.Point(0,0),fitz.Point(10,0)),
                            ("l",fitz.Point(10,0),fitz.Point(10,2)),
                            ("l",fitz.Point(10,2),fitz.Point(0,2))]}
        spec = {"ids":[0],"endpointGrid":.05,"expectedAreas":[]}
        self.assertEqual(builder.closed_wall_profiles([drawing], spec), [])
        with self.assertRaisesRegex(ValueError, "inventory changed"):
            builder.closed_wall_profiles([drawing], {**spec,"expectedAreas":[20]})
        with self.assertRaisesRegex(ValueError, "precision budget"):
            builder.closed_wall_profiles([drawing], {**spec,"endpointGrid":1})

    def test_supplementary_floors_require_their_own_projection_review(self):
        review = {"kind":"orthographic", "pages":[1], "basis":"Visually inspected overhead plan; actual curved walls retained."}
        config = {"floors":[{"page":1},{"page":3,"sourceId":"crypt"}], "sourceProjection":review,
                  "sourceFiles":[{"id":"crypt", "sourceProjection":{**review,"pages":[3]}}]}
        builder.validate_projection(config)
        config["sourceFiles"][0]["sourceProjection"]["pages"] = [1]
        with self.assertRaisesRegex(ValueError, "every extracted page"):
            builder.validate_projection(config)
        config["floors"][1]["sourceId"] = "missing"
        with self.assertRaisesRegex(ValueError, "unknown source"):
            builder.validate_projection(config)

    def test_no_scala_room_anchor_is_filled_as_masonry(self):
        model = json.loads((ROOT / "app/data/architectural-plans/la-scala.json").read_text())
        profiles = [f for floor in model["floors"] for f in floor["features"] if "-masonry-" in f["id"]]
        self.assertEqual(len(profiles), 7)
        for feature in profiles:
            for polygon in feature["polygons"]:
                shape = Polygon(polygon["outer"],polygon["holes"])
                self.assertTrue(shape.is_valid)
                self.assertFalse(any(shape.covers(Point(p["at"])) for p in model["places"]))

    def test_scala_selection_faces_follow_the_eight_source_rooms(self):
        model = json.loads((ROOT / "app/data/architectural-plans/la-scala.json").read_text())
        spaces = [space for space in model["spaces"] if space["floorId"] == "museum"]
        self.assertEqual({space["placeId"] for space in spaces}, {f"museum-{i}-1" for i in range(1, 9)})
        shapes = []
        for space in spaces:
            shape = unary_union([Polygon(p["outer"], p["holes"]) for p in space["polygons"]])
            self.assertTrue(shape.is_valid)
            anchors = [place["id"] for place in model["places"] if place["floorId"] == "museum" and shape.contains(Point(place["at"]))]
            self.assertEqual(anchors, [space["placeId"]])
            self.assertTrue(all(shape.intersection(other).area < .001 for other in shapes))
            shapes.append(shape)
        third = next(space for space in spaces if space["placeId"] == "museum-3-1")
        self.assertGreater(len(third["polygons"][0]["outer"]), 80)
        eighth = next(space for space in spaces if space["placeId"] == "museum-8-1")
        edge = eighth["polygons"][0]["outer"]
        self.assertTrue(any(abs(a[0] - b[0]) > 25 and abs(a[1] - b[1]) > 3 for a, b in zip(edge, edge[1:])))

    def test_thin_closed_line_does_not_fill_the_room(self):
        mask = np.zeros((40, 40), dtype=np.uint8)
        mask[4, 4:35] = mask[34, 4:35] = 1
        mask[4:35, 4] = mask[4:35, 34] = 1
        mask[4:35, 20] = 1
        result = builder.trace_pixel_ink(mask)
        self.assertAlmostEqual(result.area, int(mask.sum()), places=5)
        self.assertFalse(result.covers(Point(10, 10)))
        self.assertTrue(result.covers(Point(20.5, 10.5)))

    def test_nested_courtyard_and_column_holes_survive(self):
        mask = np.ones((30, 30), dtype=np.uint8)
        mask[3:27, 3:27] = 0
        mask[12:18, 12:18] = 1
        mask[14:16, 14:16] = 0
        result = builder.trace_pixel_ink(mask)
        self.assertAlmostEqual(result.area, int(mask.sum()), places=5)
        self.assertTrue(result.is_valid)
        self.assertFalse(result.covers(Point(15, 15)))

    def test_every_generated_polygon_is_valid(self):
        errors = []
        count = 0
        for path in (ROOT / "app/data/architectural-plans").glob("*.json"):
            model = json.loads(path.read_text())
            for floor in model["floors"]:
                for feature in floor["features"]:
                    for ring in feature["polygons"]:
                        p = Polygon(ring["outer"], ring["holes"])
                        if not p.is_valid or p.area <= 0:
                            errors.append(f"{path.stem}/{feature['id']}")
                        count += 1
        self.assertGreater(count, 1000)
        self.assertEqual(errors[:25], [])

    def test_openings_follow_their_room_boundary_not_a_guessed_shortcut(self):
        model = json.loads((ROOT / "app/data/architectural-plans/last-supper.json").read_text())
        for opening in model["openings"]:
            space = next(s for s in model["spaces"] if s["id"] == opening["spaceId"])
            shape = unary_union([Polygon(p["outer"], p["holes"]) for p in space["polygons"]])
            gap = LineString(opening["segment"])
            self.assertGreater(gap.length, 0)
            self.assertEqual(gap.difference(shape.boundary.buffer(.01)).length, 0, opening["id"])


if __name__ == "__main__":
    unittest.main()
