#!/usr/bin/env python3
"""Validate Fenice source-coordinate wall/detail/annotation checkpoints."""

import hashlib
import json
from pathlib import Path

from shapely.geometry import Point, Polygon
from shapely.ops import unary_union


ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "app/data/architectural-plans/fenice.json"
CONFIG_PATH = ROOT / "sources/floorplans/venues/fenice.json"
CHECKPOINT_PATH = ROOT / "sources/floorplans/rebuild-reports/fenice-geometry-checkpoints.json"


def polygon(record, origin=(0, 0)):
    outer = [(x + origin[0], y + origin[1]) for x, y in record["outer"]]
    holes = [
        [(x + origin[0], y + origin[1]) for x, y in ring]
        for ring in record.get("holes", [])
    ]
    return Polygon(outer, holes)


def geometry(features, kind, origin):
    shapes = [
        polygon(record, origin)
        for feature in features
        if feature["kind"] == kind
        for record in feature["polygons"]
    ]
    return unary_union(shapes)


def space_geometry(space):
    return unary_union([polygon(record) for record in space["polygons"]])


def main():
    model = json.loads(MODEL_PATH.read_text())
    config = json.loads(CONFIG_PATH.read_text())
    checkpoints = json.loads(CHECKPOINT_PATH.read_text())
    floors = {floor["id"]: floor for floor in model["floors"]}
    places = {place["id"]: place for place in model["places"]}
    spaces = {space["id"]: space for space in model.get("spaces", [])}
    checked = 0

    for source in checkpoints["sources"]:
        source_path = ROOT / source["file"]
        digest = hashlib.sha256(source_path.read_bytes()).hexdigest()
        if digest != source["sha256"]:
            raise AssertionError(f"Source digest mismatch: {source['id']}")
        checked += 1

    for floor_spec in config["floors"]:
        for raster in floor_spec.get("rasterLayers", []):
            if raster.get("allInkIsDetail"):
                raise AssertionError(f"Legacy all-ink detail mode remains on {floor_spec['id']}")
        checked += 1

    for floor_id, record in checkpoints["floors"].items():
        floor = floors[floor_id]
        origin = record["crop"][:2]
        wall = geometry(floor["features"], "wall", origin)
        wall_local = geometry(floor["features"], "wall", (0, 0))
        detail = geometry(floor["features"], "detail", origin)
        all_ink = unary_union([wall, detail])
        wall_count = sum(feature["kind"] == "wall" for feature in floor["features"])
        detail_count = sum(feature["kind"] == "detail" for feature in floor["features"])

        if wall_count < record["minimumWallFeatures"]:
            raise AssertionError(f"Too few wall features on {floor_id}: {wall_count}")
        if detail_count < record["minimumDetailFeatures"]:
            raise AssertionError(f"Too few detail features on {floor_id}: {detail_count}")
        checked += 2

        width = floor["bounds"][2] - floor["bounds"][0]
        height = floor["bounds"][3] - floor["bounds"][1]
        if width < record["minimumBoundsSpan"][0] or height < record["minimumBoundsSpan"][1]:
            raise AssertionError(f"Incomplete floor span on {floor_id}: {width:.2f} x {height:.2f}")
        checked += 1

        for checkpoint in record["expectedWalls"]:
            point = Point(checkpoint["point"])
            if not wall.covers(point):
                raise AssertionError(f"Missing wall checkpoint {checkpoint['id']}")
            if detail.covers(point):
                raise AssertionError(f"Wall checkpoint also classified as detail: {checkpoint['id']}")
            checked += 1

        for checkpoint in record["expectedDetails"]:
            point = Point(checkpoint["point"])
            if not detail.covers(point):
                raise AssertionError(f"Missing detail checkpoint {checkpoint['id']}")
            if wall.covers(point):
                raise AssertionError(f"Detail checkpoint also classified as wall: {checkpoint['id']}")
            checked += 1

        for checkpoint in record["excludedAnnotations"]:
            if all_ink.covers(Point(checkpoint["point"])):
                raise AssertionError(f"Printed annotation became geometry: {checkpoint['id']}")
            checked += 1

        for checkpoint in record.get("expectedVoids", []):
            if all_ink.covers(Point(checkpoint["point"])):
                raise AssertionError(f"Reviewed opening or non-geometry was filled: {checkpoint['id']}")
            checked += 1

        for feature in floor["features"]:
            for record_polygon in feature["polygons"]:
                shape = polygon(record_polygon)
                if not shape.is_valid or shape.area <= 0:
                    raise AssertionError(f"Invalid serialized polygon: {feature['id']}")
                checked += 1

        for space_id in record["expectedRoomSpaces"]:
            space = spaces.get(space_id)
            if not space or space.get("scope") != "room":
                raise AssertionError(f"Missing room-scoped space {space_id}")
            place = places.get(space["placeId"])
            if not place or place["floorId"] != floor_id:
                raise AssertionError(f"Invalid place binding for {space_id}")
            point = Point(place["at"])
            if not any(polygon(item).covers(point) for item in space["polygons"]):
                raise AssertionError(f"Room space does not contain its place anchor: {space_id}")
            checked += 1

        reviewed_spaces = []
        for checkpoint in record.get("roomSpaceCheckpoints", []):
            space = spaces[checkpoint["id"]]
            shape = space_geometry(space)
            reviewed_spaces.append((space["id"], shape))
            source_bounds = [
                shape.bounds[0] + origin[0],
                shape.bounds[1] + origin[1],
                shape.bounds[2] + origin[0],
                shape.bounds[3] + origin[1],
            ]
            if any(
                abs(source_bounds[index] - checkpoint["sourceBounds"][index])
                > checkpoint["boundsTolerance"]
                for index in range(4)
            ):
                raise AssertionError(f"Source-white bounds changed: {space['id']}")
            if not checkpoint["sourceAreaRange"][0] <= shape.area <= checkpoint["sourceAreaRange"][1]:
                raise AssertionError(f"Source-white area changed: {space['id']}")
            hole_count = sum(len(item.get("holes", [])) for item in space["polygons"])
            if hole_count != checkpoint["holes"]:
                raise AssertionError(f"Source-white hole inventory changed: {space['id']}")
            if len(space["polygons"]) != checkpoint.get("components", len(space["polygons"])):
                raise AssertionError(f"Source-white component inventory changed: {space['id']}")
            if shape.intersection(wall_local).area > 0.01:
                raise AssertionError(f"Room surface crosses source wall pixels: {space['id']}")
            checked += 5

            def local(source_point):
                return Point(source_point[0] - origin[0], source_point[1] - origin[1])

            for source_point in checkpoint["contains"]:
                if not shape.covers(local(source_point)):
                    raise AssertionError(f"Missing room interior checkpoint: {space['id']} {source_point}")
                checked += 1
            for source_point in checkpoint["excludes"]:
                if shape.covers(local(source_point)):
                    raise AssertionError(f"Room surface crosses excluded source point: {space['id']} {source_point}")
                checked += 1
            for source_point in checkpoint["boundaryNear"]:
                if shape.boundary.distance(local(source_point)) > checkpoint["boundaryTolerance"]:
                    raise AssertionError(f"Room boundary left its source face: {space['id']} {source_point}")
                checked += 1

        for checkpoint in record.get("selectionOnlyClosures", []):
            source_point = Point(checkpoint["point"])
            if all_ink.covers(source_point):
                raise AssertionError(f"Selection-only closure became geometry: {checkpoint['id']}")
            shape = space_geometry(spaces[checkpoint["spaceId"]])
            local_point = Point(
                checkpoint["point"][0] - origin[0],
                checkpoint["point"][1] - origin[1],
            )
            if shape.boundary.distance(local_point) > checkpoint["tolerance"]:
                raise AssertionError(f"Selection-only closure left source threshold: {checkpoint['id']}")
            checked += 2

        for index, (left_id, left) in enumerate(reviewed_spaces):
            for right_id, right in reviewed_spaces[index + 1:]:
                if left.intersection(right).area > 0.01:
                    raise AssertionError(f"Room surfaces overlap: {left_id} / {right_id}")
                checked += 1

    for link in model.get("verticalLinks", []):
        if link.get("kind") not in {"stairs", "elevator"}:
            raise AssertionError(f"Invalid vertical-link kind: {link.get('kind')}")
        if not link.get("label"):
            raise AssertionError("Vertical link requires a public Chinese label")
        checked += 1

    print(f"fenice source-coordinate semantic checkpoints pass: {checked}")


if __name__ == "__main__":
    main()
