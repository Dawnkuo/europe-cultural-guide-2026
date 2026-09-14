# Exterior Context Validation

Local verification: 2026-09-12. No GitHub deployment in this change.

## Coverage

- 74 canonical destinations enumerated from the current guide catalog.
- 73 fixed-location OSM datasets compiled; gondola has no specified boarding
  location and deliberately has no fabricated surroundings.
- 21 museum contexts reuse the existing source-coordinate transform.
- 12 church contexts use uniform footprint fitting. Their GLB recipe scales
  are not assumed to be metre conversions.
- 40 other contexts use approximate anchors or geographic district views.
  Unregistered district placeholders remain separately switchable.
- 73 public JSON assets total 41.46 MB, loaded per exterior, not on first page
  load. Raw acquisition caches and audit records are not public assets.

## Automated Checks

- `npx vitest run --maxWorkers=2`: 70 files, 991 tests passed.
- `npx tsc --noEmit`: passed.
- Production `build-site.mjs`: passed; the existing large-chunk warning remains.
- Targeted Oxlint for the viewer, context library, tests, compiler,
  acquisition script and screenshot audit: passed.
- Every packaged context produces finite render geometry with at most eight
  additional material batches. Tests cover source registration, height units,
  vertical building parts, tagged domes, polygon holes, road intersections,
  generic ground exclusion and missing-source behavior.
- An unrestricted parallel test run had two five-second page-test timeouts
  while browser QA was active. The two-worker full rerun passed without
  changing assertions or increasing test timeouts.

## Browser Checks

- Desktop and 390-pixel mobile viewport passes covered all 74 routes.
- Records and viewport screenshots are in `work/exterior-context-qa/`.
- Checked loaded contexts, horizontal overflow, rotation, zoom, reset,
  surroundings framing and building-layer visibility.
- Follow-up visual checks corrected the district placeholder scale,
  Cologne Triangle anchor, church recipe-unit conversion and Vatican dome.
- Source district and original schematic toggles were checked separately.
- Some early mobile screenshots were taken before correcting the screenshot
  scroll position. Pixel counts alone are not a claim of correct framing.
- During development hot reload, two transient WebGL fallback overlays were
  observed. Fresh independent page openings rendered successfully. This is
  not an actual-device stress or long-session memory-leak certification.

## Limitations

OSM is incomplete and can omit buildings, barriers, outline members and
heights. Per-site audit omissions remain explicit. Floor-derived and fallback
heights are not measured values. This flat context layer supplies neither
terrain nor routing, road clearance or visitor access guarantees. Existing
non-georeferenced landmark models are only approximately registered.

No actual-phone FPS benchmark or new offline-download certification was
performed. The existing release precache collector includes the local JSON
assets; a user's offline pack still has to complete successfully.

## Sagrada Registration Follow-Up

2026-09-12, local only. The minimum-area compound rectangle differed from
mapped nave-parallel wall `w1207779386` by 13.3245 degrees. The default west
front also put Mallorca behind the model. `reviewed-axes.json` now fixes the
directed axis from source nodes and records the official facade/street pairs.
The compiler retains uniform scaling and does not alter raw road geometry.

- Both new street-alignment and facade-side tests failed before the fix and
  passed afterwards. A third test prevents swapping a reviewed axis simply
  because the compound's transverse extent is larger.
- Full regression: 70 files, 996 tests passed with two workers.
- TypeScript, targeted Oxlint and production build passed. The existing
  large-chunk build warning and jsdom canvas notices remain.
- Browser QA at 1440x1000 and 390x844: model/context rendered, no horizontal
  overflow, camera rotation/reset worked, no browser error logs. Visual
  evidence is in `work/sagrada-axis-qa/`; mobile canvas pixel checks confirm
  both the light landmark and surrounding geometry are nonblank.
- The Sagrada GLB hash remained
  `545e5b4842d05853cec536b4085b7b5815a0f22d455d2268e654869053ba6aad`.
  The previous window clearance fix is preserved. No GitHub deployment.
