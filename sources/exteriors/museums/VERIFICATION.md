# Museum exterior massing, 2026-09-11

## Scope

21 local GLB exteriors and matching static top-view fallbacks. These extend the
approved church massing renderer; they do not replace indoor plans, ticket data,
route order, collection records, or entry-floor defaults. No deployment performed.

Horizontal envelopes come from the selected OSM records in `catalog.mjs` and the
cached responses in `raw/`. Architectural references are recorded per site in
`source-manifest.json`. A named place marker is not accepted as a building survey.
Untagged heights, roof slopes, window rhythms, cornices and selected feature sizes
are schematic estimates, not measured geometry or exact facade inventories.

## Specific decisions

- Vatican: retain the original campus ground as one continuous shallow platform.
  All four court surfaces remain present; no ground excavation. Separate built
  wings sit above this ground. Adjoining palace context does not imply visitor access.
- Chocolate Museum: include the old customs house, greenhouse and modern glass
  buildings, not just the museum's main mapped object.
- Brera: the mapped botanical-garden Cupolino is a small ground-level pavilion,
  not a dome floating above the palace. The main observatory roof domes are not
  individually reconstructed from survey data in this model.
- Florence Accademia: connected former institutional buildings include adjoining
  academy context. The David tribune skylight is approximately registered from
  the official 2024 visitor plan and Tucci/Bonora/Conti/Fiorini architectural survey
  published by Altralinea (2017), figures 3A and 21/22. It is not a surveyed GPS
  coordinate. The unrelated cafe named Il David is explicitly not used.
- Uffizi: the Tribuna roof uses its own mapped footprint, not the adjacent building.
- Correr: connected Procuratie context is exterior context, not museum ownership
  or a claim about the visitor route. Venice Accademia distinguishes former church
  and convent volumes. The Vasari exterior envelope does not establish indoor levels.
- Roofs: build-time straight-skeleton geometry follows the footprint; sub-0.25 m2
  union slivers are omitted only from roof solving, not from source footprints.
  True courtyards remain identifiable. No building roof is inferred as an indoor plan.

## Verification

- `npx vitest run`: 69 files, 904 tests passed, including all 21 GLB loads,
  finite positions/normals/UVs, local SVG fallbacks, registry coverage, distinct
  geometry hashes, landmark anchoring, open arcades and Vatican retained ground.
- Production `build-site.mjs`: passed. Existing chunk-size warning remains.
- Standalone preview: 105 screenshots, desktop oblique/top/front/side plus 390x844
  mobile for every museum. Canvas-region pixel checks: 105 nonblank.
- All 21 mobile previews: keyboard rotation changes the camera; no page overflow.
- All 21 main guide pages at 390px: correct museum GLB identifier and nonempty
  rendered canvas, no horizontal overflow. Existing indoor views remain the default
  where indoor data exists. Vatican explicitly checked in 2D on its entry floor.
- Main viewer pointer drag, zoom and reset checked at mobile width. No captured
  console errors during the integration run. This is not a real-device FPS benchmark.
- Local assets participate in the existing generated precache file-extension rules.
  This turn does not claim a new full offline-download or GitHub deployment test.

Screenshots and machine-readable results are in ignored `work/museum-exterior-qa/`.
Rebuild with `node scripts/build-museum-exteriors.mjs`; run tests after that process
finishes so the catalog and binary files are from the same completed generation.

## Courtyard depth correction

The initial Vatican model placed court surfaces at 0.24 above a base cap at 0.22.
After display normalization their separation was only 0.000667 scene units, which
could compete for perspective depth-buffer precision. Court materials now partition
one top surface at 0.22, with a retained bottom and perimeter. The covered footprint
is the union of the campus and all four court surfaces; no ground area is removed.
Ground meshes are front-sided shadow receivers, not self-shadowing casters.

Regression checks raycast every court triangle interior to require exactly one
upward ground hit and compare total upward surface area against the footprint
union. Museum/church tests: 59 passed. Production build and changed-file lint passed.
Main-site checks: eight desktop orbit angles and six 390px mobile angles, nonblank
canvas and visible green surface throughout. Artifacts: `work/vatican-ground-flicker/`.
