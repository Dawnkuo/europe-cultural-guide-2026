# Pisa architectural-plan rebuild

Status: **ready for Main to install** from `/tmp/europe-map-rebuild-pisa`.

## Concrete coverage

| Venue | Modeled scope | Anchors | Bound guide stops | Explicit misses |
| --- | --- | ---: | --- | --- |
| `leaning-tower` | 基座平面 | 3 | 1, 2 | Stops 0, 3, 4; no reviewed upper-level plans |
| `pisa-cathedral` | 底层平面（1817年测绘） | 4 | 1, 3 | Stops 0, 2, 4; no current visitor, crypt, roof or matroneum plan |
| `pisa-baptistery` | 底层平面 | 3 | 0, 1, 2 | Stop 3; women's gallery appears in section only |
| `camposanto` | 底层测绘平面 | 5 | 0 | Stops 1-3; survey does not label current artwork positions |
| `opera-pisa` | 底层与回廊 | 3 | 4 | Stops 0-3; no upper-floor plan or collection-zone labels |
| `sinopie` | 已发表的建筑外轮廓 | 1 | none | Both interior levels and all four stops; current sources publish no interior plan |

Total: 6 models, 6 modeled source sheets, 19 geometry-based anchors, 9 resolved stop bindings. Every route node remains in the guide; unsupported nodes are simply not bound.

## Space policy

`sourceSpaces` is empty for all six models because none of the reviewed extracted plans exposes exact interior floor-fill paths. Line surveys were not closed into invented floor polygons. Sinopie's official building fill is flat exterior context only, not a claimed interior room.

## Validation

- Shared generator imported read-only with `module.ROOT` set to scratch; all six configs build.
- Source and supplementary digests pass; projection page coverage passes.
- Every binding references an emitted place and a valid stop index.
- All 19 anchors fall within floor bounds; all area anchors checked outside structural wall polygons.
- All emitted polygons are valid and nonzero-area.
- Public floor labels, place labels and limitations are Chinese; review and claim evidence remains English.
- Six derived extracts and six generated model previews were visually inspected.
- A full derive-and-build rerun produced byte-identical model and evidence JSON.

## Install paths

Install the six files from each of these mirrored directories:

- `sources/floorplans/venues/`
- `app/data/architectural-plans/`
- `sources/floorplans/evidence/`

Also install `sources/floorplans/derived/`, the seven parent inputs listed in `sources/floorplans/download-manifest.json`, and `scripts/rebuild-pisa.py` if reproducible derivation is wanted. The machine-readable exact list is in `pisa.json` beside this report.

Do not install the failed `pisa-baptistery-hbim.pdf` download or the contextual historical/competition PDFs listed under `doNotInstall` in the JSON report.
