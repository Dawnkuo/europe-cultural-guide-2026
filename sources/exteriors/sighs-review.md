# Bridge of Sighs Exterior Review

Local-only continuation, September 9, 2026. This is a recognizable, normalized
exterior model, not a measured mesh or a complete reconstruction of its sculpture.
It replaces the former generic enclosed-bridge recipe for this chapter only.

## Evidence Inspected

1. MUVE, current Palazzo Ducale guide, PDF page 6 (printed page 5):
   https://palazzoducale.visitmuve.it/wp-content/uploads/sites/2/2025/10/Guida-Ducale-ENG.pdf
   648356 bytes, SHA256
   `31d59320ad2d0d509e2b4cbfca8fbb9fda1f683a4bccb2f1fc03e3bce0945cd1`.
   This overhead diagram establishes the separated adjacent passages between
   the palace and New Prisons. The numbered 33 label is displaced from the
   physical bridge. Do not turn that printed number into a facade coordinate.
   `loggia-path-128-surface` is one passage, not the entire bridge width;
   the adjoining passage/approach appears in `loggia-path-73-surface`.
2. MUVE's exterior photograph, linked from its Prisons page:
   https://palazzoducale.visitmuve.it/en/layout-and-collections/prisons/
   https://palazzoducale.visitmuve.it/wp-content/uploads/sites/2/2025/06/Ponte-dei-sospiri.jpg
   1280x879, 496067 bytes, SHA256
   `68ef409eead0b1c65c8682ecdc9699d4a3dbd589ad22ad3027910cd8014b81ba`.
   Viewed in full. This is the sea-facing/southern elevation seen from near
   Ponte della Paglia, not the city's northern side. It supports the arch,
   horizontal cornices, two stone-grid windows, pilasters and curled crown.
3. Benoit Prieur's own photograph, December 31, 2022, opposite city-facing side:
   https://commons.wikimedia.org/wiki/File:Pont_des_Soupirs_et_gondoles_(d%C3%A9cembre_2022).JPG
   2832x3896, 7012803 bytes, SHA256
   `734c8a3642264a0ba9549d8a94d3925d6d006b1ee248b59e478c097746558ac5`.
   Its labelled source and raw metadata are retained in the work folder.
   The palace is now on the right; the sea/Paglia are beyond the arch.
   This corroborates two windows on that side and a differently shaped central
   shield. The northern face must not use an unqualified mirror of southern
   heraldic detail. This photograph is an observation, not an orthographic plan.

Local source material: `work/experience/sighs-source/`. None of these source
photographs/PDF pages is published as a map, texture or background by this pass.
The unsuccessful Berkeley document fetch was not retried around its 403.

## Geometry And Precision

- Application data: `app/data/sighs-exterior.ts`; renderer:
  `app/lib/sighs-exterior-model.ts`. The displayed bridge span is 12 normalized
  units, not 12m. No surveying-grade measurements are asserted.
- The south photograph is nearly frontal but remains perspective imagery.
  The initial visual coordinate comparison uses approximately x=561+38.5X,
  y=430-38.5Y. Curves/pilasters/opening proportions are manually normalized from
  this image, with small perspective and carving differences left as explicit
  uncertainty. This is NOT an accepted rectification for a 2D floor plan.
- Guide depth/width relationships constrain the bridge to a narrow double
  passage, rather than the previous broad cuboid. Local wall/divider thickness,
  floor level and the isolated connection cuts are schematic. The palace-side
  stair/approach is not copied into two identical reconstructed indoor routes.
- Intrados and four windows are real geometry openings. The two passage voids
  remain separated by a wall. The three-by-three radial grille articulation is
  a simplified stone-bar pattern; curved leaf sections are not a scanned copy.
- Cornices, panel borders and crest spirals have relief. Figurative faces,
  lions, heraldic charges, inscriptions and their fine carving remain absent,
  rather than being fabricated. Crest edges are softened within0.12 display
  unit; six volute backing discs on each face remain attached to the crown.
- The roof is a thin approximate envelope linking the two visible facade
  arches. Its hidden section, actual thickness, roof joints and detailed
  water management remain unverified. It must not be promoted as measured
  interior vault data or a fully finished high-detail exterior.
- Only the bridge is modeled. There are no invented neighboring palace/prison
  blocks, water-level claims, new public doorways or mapped route markers.
  The two end cuts expose connection sections, not street entrances.
- Existing Doge's Palace indoor geometry is untouched: SHA256
  `daec0073928b208f4df8a67597219945e053a0d5633ab668d62a9f971f74c696`.
  No floors, room IDs, stops, itinerary timing, ticket data or booking change.
  Two explanatory orientation headings now correctly say south/north rather
  than west/east; the ordered sightseeing list remains intact.

## Implementation And Acceptance Boundary

- Per-venue dynamic import; four material batches. Shared renderer controls
  expose whole bridge, south, north and a central intrados close-up. The last
  can look slightly upward under the arch without changing other venues'
  orbit limits. Toolbar has its own reserved space above the canvas.
- `scripts/render-sighs-fallback.mjs` renders the local1440x1200 WebP from the
  same model; no substitute photograph. Existing manifest generation includes
  this asset and the lazy module. A revision-specific offline run is required
  before asserting first-unvisited-route availability.
- Unit rays check the canal opening, two longitudinal voids, dividing wall
  and actual interstices of all four grilles. Material counts and finite
  geometry are checked separately from source completeness.
- `scripts/qa-sighs-exterior.mjs` exercises four widths, both facade views,
  arch close-up, keyboard, drag, phone pinch, reset and real browser WebGL
  context loss/retry. Captures are centered below sticky navigation; otherwise
  overlay buttons contaminate canvas pixel bounds. Final revision/build and
  offline reports belong in the progress log, not inferred from passing units.

This is an improved exterior treatment, not whole-site acceptance. Unverified
roof geometry, simplified relief, incomplete adjacent buildings and physical
phone performance remain explicit limits. No public deployment is authorized.

## Verified Local Export

Export `438aa3a844541924195a` includes the lazy model chunk and the1440x1200
fallback (70230 bytes, SHA256
`1020a22ba303928337fc0969839f4159e3142a8097b02d08f7e6d1e90d9e518a`).
Four-width production interaction/pixel/fallback checks pass at1440,820,390,320.
A separate390px test first opens the chapter after homepage precaching and
network disconnection. Both report9draw calls and123538rendered triangles,
including the shadow pass. These are browser results, not physical-phone FPS.
Reports: `work/experience/sighs-production-final/report.json` and
`work/experience/sighs-offline-final/report.json`. Full-trip regression passes
148cases on this same revision; see `work/experience/sighs-site-regression`.

The user subsequently requested a latest local trial package before completion.
That request authorizes an explicitly incomplete trial, not public deployment
or a change to any geometry/source-completeness claim above.
