# Tuscany architectural-plan rebuild

Status: stable partial handoff with four source-backed model artifacts; this is not full venue acceptance. Vasari Corridor remains explicitly source-limited.

| Venue | Source-backed diagrams | Bound guide stops | Unresolved guide stops |
| --- | ---: | ---: | --- |
| Florence Duomo | 1 historic main-floor plan | 0/5 | Exterior, ticket entrance, inner dome and roof nodes are outside the published plan |
| Giunti Odeon | Ground, first and second project plans | 4/4 | No unresolved guide node; current upper-floor public access remains operationally uncertain |
| Mercato Centrale | 1 upper-hall plan | 2/4 | Exterior and ground-floor stall grid |
| Medici Chapels | Complex overview plus independent New Sacristy survey | 2/5 | Medici crypt, treasury and Lorraine crypt |
| Vasari Corridor | No corridor-body plan | 0/5 | All nodes; see `evidence/vasari-corridor.json` |

Generated total: 7 source diagrams, 18 places, 8 semantic spaces, 6,827 features, and 8 of 23 guide stops bound. The sources print no room-number inventory; no room numbers were invented. Visible architectural linework is retained within each reviewed crop.

## Evidence decisions

- Duomo uses the Opera del Duomo catalogue image wrapped one-to-one in a PDF. Because historic pavement and masonry share one grayscale raster, all ink remains flat detail; false wall extrusion was rejected.
- Giunti uses the three orthographic plans on PDF page 50 of the PAT 2024 award catalogue. Matching stair footprints are linked physically without claiming current public access; each level has a reviewed selectable floor area.
- Mercato uses all ten image tiles composing Archea's page-2 upper-hall plan. The source has no ground-floor plan.
- Medici uses the existing chapel-complex portion of the 1:400 competition sheet and a separate 1:50 New Sacristy laser survey. The proposed exit zone is cropped out; the diagrams are not forced into one registration.
- Vasari's official access PDF maps only Uffizi circulation to D19. The official publication sample has an oblique aerial overview but no floor plan, so no corridor geometry was fabricated.

## Validation

`work/map-venv/bin/python /tmp/europe-map-rebuild-tuscany/scripts/rebuild-tuscany.py` passes source hashes, source-specific projection pages, Chinese public-string checks, place evidence/precision, per-floor semantic-space coverage, polygon validity, identifier/reference integrity, stop inventory and evidence totals. All selected source diagrams and all seven generated top-view renders were visually inspected.

The eight semantic selections use reviewed raster-derived `spaces` polygons. None of these source plates exposes a separately extractable vector floor fill, so no raster xref is mislabeled as a `sourceSpaces` vector path.

Install paths and every route-node disposition are enumerated in `tuscany.json`. Main must handle installation and any global availability change; this scratch task did not edit the repository.
