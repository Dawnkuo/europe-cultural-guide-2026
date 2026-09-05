#!/usr/bin/env python3
"""Validate Pisa route bindings, source digests and portable build contracts."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "sources/floorplans/rebuild-reports/pisa-route-bindings-portable-v1.json"
OUTPUT = ROOT / "qa/pisa-route-portable-v1-validation.json"
SLUGS = (
    "leaning-tower",
    "pisa-cathedral",
    "pisa-baptistery",
    "camposanto",
    "opera-pisa",
)
EXPECTED_STOP_COUNTS = {
    "leaning-tower": 5,
    "pisa-cathedral": 5,
    "pisa-baptistery": 4,
    "camposanto": 4,
    "opera-pisa": 5,
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_records(config: dict) -> list[tuple[str, str, str]]:
    records = [("primary", config["file"], config["sha256"])]
    records.extend(
        (item["id"], item["file"], item["sha256"])
        for item in config.get("sourceFiles", [])
    )
    return records


def main() -> None:
    route_report = json.loads(REPORT.read_text(encoding="utf-8"))
    report_venues = {item["slug"]: item for item in route_report["venues"]}
    if set(report_venues) != set(SLUGS):
        raise AssertionError("Route report venue inventory changed")

    venue_results = []
    total_stops = total_bound = total_places = total_features = total_floors = 0
    for slug in SLUGS:
        config_path = ROOT / "sources/floorplans/venues" / f"{slug}.json"
        model_path = ROOT / "app/data/architectural-plans" / f"{slug}.json"
        evidence_path = ROOT / "sources/floorplans/evidence" / f"{slug}.json"
        config = json.loads(config_path.read_text(encoding="utf-8"))
        model = json.loads(model_path.read_text(encoding="utf-8"))
        venue_report = report_venues[slug]

        stops = venue_report["stops"]
        expected_count = EXPECTED_STOP_COUNTS[slug]
        if len(stops) != expected_count:
            raise AssertionError(f"{slug}: expected {expected_count} route stops")
        if [item["stopIndex"] for item in stops] != list(range(expected_count)):
            raise AssertionError(f"{slug}: route stop indices must be complete and ordered")
        if any(item["status"] not in {"bound", "unresolved"} for item in stops):
            raise AssertionError(f"{slug}: invalid route status")

        expected_bindings = [
            {"stopIndex": item["stopIndex"], "placeId": item["placeId"]}
            for item in stops
            if item["status"] == "bound"
        ]
        if config.get("stopBindings", []) != expected_bindings:
            raise AssertionError(f"{slug}: config route bindings differ from the audit")
        if model.get("stopBindings", []) != expected_bindings:
            raise AssertionError(f"{slug}: generated route bindings differ from the audit")

        place_ids = {item["id"] for item in model["places"]}
        for binding in expected_bindings:
            if binding["placeId"] not in place_ids:
                raise AssertionError(f"{slug}: missing bound place {binding['placeId']}")
        unresolved = {item["stopIndex"] for item in stops if item["status"] == "unresolved"}
        if unresolved & {item["stopIndex"] for item in expected_bindings}:
            raise AssertionError(f"{slug}: unresolved stop was bound")

        verified_sources = []
        expected_source_digests = {}
        for source_id, file_name, expected_hash in source_records(config):
            path = ROOT / "sources/floorplans" / file_name
            if not path.is_file():
                raise AssertionError(f"{slug}: missing source {file_name}")
            actual_hash = digest(path)
            if actual_hash != expected_hash:
                raise AssertionError(f"{slug}: source hash mismatch {file_name}")
            expected_source_digests[source_id] = actual_hash
            verified_sources.append({"id": source_id, "file": file_name, "sha256": actual_hash})
        model_source_digests = model.get("sourceDigests", {"primary": model["sourceDigest"]})
        if model_source_digests != expected_source_digests:
            raise AssertionError(f"{slug}: generated source digest inventory changed")

        for link in model.get("verticalLinks", []):
            if link.get("kind") not in {"stairs", "elevator"} or not link.get("label", "").strip():
                raise AssertionError(f"{slug}: invalid vertical link contract")
            if link["fromPlaceId"] not in place_ids or link["toPlaceId"] not in place_ids:
                raise AssertionError(f"{slug}: vertical link endpoint is missing")
        floor_by_place = {item["id"]: item["floorId"] for item in model["places"]}
        for link in model.get("verticalLinks", []):
            if floor_by_place[link["fromPlaceId"]] == floor_by_place[link["toPlaceId"]]:
                raise AssertionError(f"{slug}: vertical link endpoints share one model floor")

        floor_count = len(model["floors"])
        place_count = len(model["places"])
        feature_count = sum(len(floor["features"]) for floor in model["floors"])
        total_floors += floor_count
        total_places += place_count
        total_features += feature_count
        total_stops += len(stops)
        total_bound += len(expected_bindings)
        venue_results.append({
            "slug": slug,
            "floorsOrSourcePlanGroups": floor_count,
            "places": place_count,
            "features": feature_count,
            "routeStops": len(stops),
            "bound": len(expected_bindings),
            "unresolved": len(stops) - len(expected_bindings),
            "verticalLinks": len(model.get("verticalLinks", [])),
            "configSha256": digest(config_path),
            "modelSha256": digest(model_path),
            "evidenceSha256": digest(evidence_path),
            "sources": verified_sources,
        })

    tower = json.loads((ROOT / "app/data/architectural-plans/leaning-tower.json").read_text())
    if [item["id"] for item in tower["floors"]] != [
        "base", "entry-first", "galleries-1-3", "galleries-4-7", "upper"
    ]:
        raise AssertionError("Tower source-plan-group inventory changed")
    tower_link_ids = {item["id"] for item in tower["verticalLinks"]}
    if "entry-to-lower-galleries" in tower_link_ids or len(tower_link_ids) != 3:
        raise AssertionError("Tower contains a representation-only or unexpected connection")

    baptistery = json.loads((ROOT / "app/data/architectural-plans/pisa-baptistery.json").read_text())
    if baptistery.get("spaces"):
        raise AssertionError("Baptistery v2 must not infer an annular floor surface")
    if baptistery.get("verticalLinks"):
        raise AssertionError("Baptistery must not invent an unpositioned stair connection")
    baptistery_audit = json.loads(
        (ROOT / "qa/baptistery-upper-v2/pisa-baptistery-first-floor-audit-v2.json").read_text()
    )
    if baptistery_audit["outsideSourcePixels"] != 0:
        raise AssertionError("Baptistery v2 contains source-external pixels")
    if baptistery_audit["surfaceBoundaryAudit"]["sourceSpaceEmitted"]:
        raise AssertionError("Baptistery v2 unexpectedly emitted a floor surface")
    if baptistery_audit["radialArchVaultPixels"] != "flat detail; none promoted by angle corridors":
        raise AssertionError("Baptistery radial classification changed")

    totals = {
        "venues": len(SLUGS),
        "routeStops": total_stops,
        "bound": total_bound,
        "unresolved": total_stops - total_bound,
        "modelFloorsOrSourcePlanGroups": total_floors,
        "places": total_places,
        "features": total_features,
    }
    if totals != route_report["coverage"]:
        raise AssertionError(f"Coverage mismatch: {totals} != {route_report['coverage']}")

    absolute_refs = []
    for path in [
        *sorted((ROOT / "scripts").glob("*.py")),
        *sorted((ROOT / "sources/floorplans/venues").glob("*.json")),
    ]:
        text = path.read_text(encoding="utf-8")
        user_root_marker = "/" + "Users/"
        scratch_root_marker = "/" + "tmp/europe-map-rebuild-pisa"
        if user_root_marker in text or scratch_root_marker in text:
            absolute_refs.append(str(path.relative_to(ROOT)))
    if absolute_refs:
        raise AssertionError(f"Nonportable absolute references: {absolute_refs}")

    output = {
        "status": "pass",
        "totals": totals,
        "towerCoverageSemantics": "five source-plan groups, not eight independent floor plates",
        "towerRepresentationOnlyLinkAbsent": True,
        "baptisteryRadialArchVaultTracesFlat": True,
        "baptisterySourceSpaces": 0,
        "portableAbsoluteReferences": absolute_refs,
        "venues": venue_results,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
