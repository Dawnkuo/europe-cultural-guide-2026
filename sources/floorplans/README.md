# Indoor Map Rebuild

Status: in progress, local preview only. Generated models are not a completed migration.

## Evidence Pipeline

1. Acquire the official or authoritative plan and inspect its actual page images.
2. Pin the PDF SHA-256 and the relevant page/crop in `extraction.json` or `venues/*.json`.
3. Classify original geometry as masonry, floor area, or flat detail. Doors remain gaps. Furniture, text, service symbols and stair treads do not become walls.
4. Use orthographic geometry with equal x/y units. The builder requires an explicit `sourceProjection` review with the visual basis and every extracted page. It rejects unknown, oblique or perspective sources; those need a separately verified rectified plan before extraction, not a tag that disguises uncorrected geometry.
5. Run the builder. The same polygons, holes, exact room identifiers and anchors feed SVG and Three.js. Internal feature-to-source records are generated into `evidence/`.
6. Validate geometry, compare each room ID and text in the browser, and complete interaction, mobile, offline and performance checks before approving a venue.

Raw PDFs stay outside `public/` and are gitignored. Their URLs and hashes remain in the configs. Restore these files from their pinned URLs before rebuilding; a changed hash intentionally fails the build. Normal site tests and builds do not require unpublished raw files.

```sh
work/map-venv/bin/python scripts/build-architectural-plans.py
work/map-venv/bin/python scripts/test_architectural_plans.py
npx vitest run
node scripts/audit-architectural-migration.mjs
```

Dependencies: `scripts/map-requirements.txt`. Extraction uses PyMuPDF, Shapely, NumPy and OpenCV. Raster-derived plans retain source limitations; tracing low-resolution pixels is not a substitute for a high-quality architectural plan.

## Current Coverage

Twelve source-derived drafts: Uffizi, La Scala, Accademia Florence, Doge's Palace, Last Supper, Picasso Barcelona, Correr, Pitti, Cologne Cathedral, Sagrada Familia, Borghese and Brera. They contain 20 floor diagrams and 332 positioned room/service markers. The remaining 35 inventory entries have not been rebuilt.

- Uffizi: two exhibition floors, all 94 printed room labels including the repeated D22; one verified Lanzi stair connection. Ground reception and Vasari Corridor are not included.
- Doge's Palace: five distinct source diagrams, all printed room labels. Only the Censors Stair connection is bound across floors. Unregistered floors are separated display diagrams, not measured architectural stacking.
- Pitti: Palatine Gallery only. Other palace collections and floors remain missing.
- Cologne: detailed nave plan only. Tower and treasury floors remain missing.
- Sagrada: low-resolution published architectural project plan. It contains planned structures and needs a clearer source. No tower or crypt floor plans have been reconstructed.
- Borghese: sculpture level I-VIII and adjoining garden. Upper painting gallery is missing.
- Brera: main exhibition floor with every one of its 35 printed room IDs (including 1A) and five services. The source does not print 16/17/25/26; these numbers are not invented.
- Last Supper: four whole-space polygons and four source door gaps. The ticket-office entrance keeps both actual jamb endpoints, rather than a shortcut across the angled perimeter.
- La Scala: seven inspected closed masonry profiles retain actual source thickness instead of extruding both sides as separate walls. Unclosed central contours remain flat pending review; the builder never bridges them into a guessed room or wall.
- Accademia Florence: five source-footprint space bindings, including the connected Prisoners/David gallery and the multipart instrument gallery. Picasso: source-footprint selection for rooms 12 and 13; upper courtyard context is not a slab. These additions do not mean all room semantics are finished.
- Other generated drafts still need complete room semantics, doorway classification, stop binding and inter-floor route audits. A source room label is not an artwork's precise wall location.

The old generic indoor renderer is no longer reachable through guide pages. Unrebuilt interiors retain exterior scenes and an explicit pending state. This is not counted as successful reconstruction.

## Rejected / Insufficient Candidates

- Casa Batllo: the official restoration PDF request failed. The UPC conservation article was acquired and visually reviewed; it compares historic building phases and is not a current, complete visitor plan. Do not merge the different historic layouts into a present-day interior.
- Palau de la Musica: the acquired official PDF is a seating chart. Seat boxes are not walls or complete building floor plans.
- Museum Ludwig: the acquired 2021 visitor leaflet has coarse gallery footprints, not detailed wall/door geometry. Historical exhibition labels must not be presented as current.
- Sagrada structural lecture: the general-plan illustration is a secondary-resolution image; the later chapel plans in that file are for Rancagua, Chile, not extra floors of the Barcelona basilica.
- Vatican: the same base complex image is reused in different visitor-map layouts. Do not turn repeated page images into fabricated separate floors.

## Release Gate

`release-review.json` starts with no approved venues. `audit-architectural-migration.mjs --release` blocks GitHub deployment until every indoor venue has either a hash-matched complete acceptance record or a specifically documented evidence limitation. Acceptance pins both `sourceDigest` and `modelDigest` (SHA-256 of the parsed model's JSON serialization), so altered geometry cannot reuse an old PDF's approval. The full acceptance matrix includes geometry, floor coverage, all room IDs, stop bindings, vertical links, desktop/portrait/keyboard/interrupted-drag checks, offline refresh and performance.

At this stage the gate must fail. Passing unit tests or a production build does not authorize publishing this partial migration.

## Verification Record

See `qa-local.md` for the actual local checks and unresolved acceptance work. `acquisition-report.json` records the existing-manifest PDF acquisition pass, not an exhaustive search of official or scholarly sources.

The production offline manifest includes static route payloads and every lazy map chunk. The generated service-worker cache version includes a content digest, so replacing a same-named map asset triggers a new install. A ready badge is emitted only after the complete precache succeeds, and cannot be borrowed from the old worker while an update installs.
