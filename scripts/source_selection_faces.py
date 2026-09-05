"""Source-coordinate selection proposals, never a source of new wall geometry."""

import math

import fitz
from shapely.geometry import LineString, Point
from shapely.ops import unary_union


def parts(geometry):
    if geometry.is_empty:
        return []
    return list(geometry.geoms) if hasattr(geometry, "geoms") else [geometry]


def propose_cuts(surface, walls, max_gap=25):
    boundaries = unary_union([surface.boundary, *walls])
    endpoints = [Point(p) for wall in walls for p in (wall.coords[0], wall.coords[-1])]
    proposals = {}
    for wall in walls:
        coords = list(wall.coords)
        for end, before in [(coords[0], coords[1]), (coords[-1], coords[-2])]:
            length = math.dist(end, before)
            if length < .01:
                continue
            direction = [(end[i] - before[i]) / length for i in (0, 1)]
            ray = LineString([[end[i] + direction[i] * d for i in (0, 1)] for d in (.01, max_gap)])
            contacts = []
            for hit in parts(ray.intersection(boundaries)):
                if hit.geom_type == "Point":
                    contacts.append(hit)
                elif hit.geom_type == "LineString":
                    contacts += [Point(hit.coords[0]), Point(hit.coords[-1])]
            for point in endpoints:
                distance = point.distance(Point(end))
                if not .05 < distance <= max_gap:
                    continue
                alignment = sum((point.coords[0][i] - end[i]) * direction[i] for i in (0, 1)) / distance
                if alignment > .999:
                    contacts.append(point)
            if not contacts:
                continue
            target = min(contacts, key=lambda p: p.distance(Point(end)))
            if target.distance(Point(end)) <= .05:
                continue
            segment = [list(end), list(target.coords[0])]
            key = tuple(sorted(tuple(round(v, 2) for v in point) for point in segment))
            proposals[key] = {"segment": [[round(v, 5) for v in p] for p in segment]}
    return [{"id": f"cut-{i + 1}", **cut} for i, cut in enumerate(proposals.values())]


def derive(surface, walls, cuts, anchors):
    lines = [*walls, *[LineString(c["segment"]) for c in cuts]]
    # A 0.02 pt tolerance joins separately rounded PDF endpoints in selection
    # only. It is far smaller than the source's one-point partition strokes.
    barriers = unary_union([line.buffer(.02, cap_style=3, join_style=2) for line in lines])
    faces = [p for p in parts(surface.difference(barriers)) if p.geom_type == "Polygon" and p.area > .1]
    grouped = {}
    missing = []
    for place in anchors:
        point = Point(place["at"])
        match = next((i for i, face in enumerate(faces) if face.covers(point)), None)
        if match is None:
            missing.append(place["label"])
        else:
            grouped.setdefault(match, []).append(place)
    return faces, grouped, missing


def overlay(page, floor, faces, grouped, cuts, path):
    clone = fitz.open()
    clone.insert_pdf(page.parent, from_page=page.number, to_page=page.number)
    canvas = clone[0]
    palette = [(1, .6, .15), (.15, .8, .7), (.65, .4, 1), (.2, .6, 1)]
    for index, (face_id, places) in enumerate(grouped.items()):
        shape = canvas.new_shape()
        face = faces[face_id]
        shape.draw_polyline(list(face.exterior.coords))
        for hole in face.interiors:
            shape.draw_polyline(list(hole.coords))
        shape.finish(color=palette[index % 4], fill=palette[index % 4], fill_opacity=.2, width=.3, even_odd=True)
        shape.commit()
    for cut in cuts:
        a, b = cut["segment"]
        canvas.draw_line(a, b, color=(1, 0, .3), width=.7)
        at = [(a[i] + b[i]) / 2 for i in (0, 1)]
        canvas.insert_text(at, cut["id"].replace("cut-", ""), fontsize=3, color=(.5, 0, .2))
    pixels = canvas.get_pixmap(matrix=fitz.Matrix(4, 4), clip=fitz.Rect(floor["crop"]))
    pixels.save(str(path))
    clone.close()
