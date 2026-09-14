# OSM Exterior Surroundings

Scope: all 74 current canonical guide destinations. 73 have fixed locations;
`gondola` deliberately has no fabricated boarding point or neighbourhood.
This layer does not modify itineraries, indoor geometry, entry-floor defaults,
or the approved church and museum GLB assets.

## Reproduction

- `npm run context:acquire`: enumerate `guideCatalog`, resolve existing trip
  locations, acquire one cached OSM map extract per destination. Existing files
  are reused. Source URLs, bounding boxes, timestamps and raw elements remain
  in `raw/`. The first-party OSM map API is the source, not screenshot tracing.
- `npm run context:build`: generate the per-destination JSON under
  `public/maps/exterior-context/` and internal `*.audit.json` records. Either
  script accepts a list of canonical slugs for targeted work.
- `npx vitest run app/lib/exterior-context.test.ts`: validate geometry,
  coverage, height parsing, source registration and rendering batch budgets.

## Geometry and Precision

- Coordinates are local metres, X east, Z south. Integer-millimetre Clipper
  Boolean operations stabilize intersections. This numerical tolerance does
  not imply that OSM itself has millimetre accuracy.
- Museum environments reuse the exact source-to-display matrix exported in
  the existing GLB. Their origin is the same source location used by the model.
- Other existing models are approximately registered from a mapped footprint,
  its oriented rectangle and a uniform scale. No non-uniform model stretching.
  Church facades use the existing +Z front convention, choosing the documented
  west/front side of the footprint axis; Barcelona and Santa Maria del Mar use
  their northwest/southwest front directions. These fits are not surveyed.
- Reviewed axes in `reviewed-axes.json` override the minimum-area rectangle
  and default front direction. Sagrada Familia uses wall `w1207779386`, with
  its directed node pair pointing toward the Glory facade on Mallorca.
  The irregular envelope's rectangle was 13.3245 degrees off the nave axis;
  the former west-facing default also reversed its front/back street sides.
  The official booklet (printed page 3) identifies Mallorca/Glory,
  Provenca/apse, Marina/Nativity and Sardenya/Passion. Generation validates
  the source nodes and retains the review in the audit. Streets are not
  straightened or moved individually to fit the model.
- Church exports mix metres and custom recipe units. Their stored GLB display
  normalization is not treated as a metre conversion: the mapped footprint and
  actual displayed horizontal bounds determine one uniform context scale.
  Generic landmark anchor bounds exclude decorative water, garden and plaza
  meshes, which are hidden once their real context layers are available.
- Santa Maria delle Grazie uses named church relation `r19382652`, not the old
  trip POI outside the church. Saint Peter's uses the retained model's basilica
  framing region and scale, with the basilica footprint as anchor. Its OSM
  basilica, square, forecourt and colonnades are excluded from duplicate massing.
- Area-representative locations do not have registered individual landmark
  coordinates. Their default is the geographic OSM context; the previous
  schematic scene remains separately switchable rather than oversized generic
  blocks being superimposed on a real neighbourhood. Cologne Triangle uses
  named building `w21113435`, not the roof-level viewpoint's smaller container.
- The active landmark's source footprint is excluded. Courtyard grounds in
  the existing Vatican model are retained, never excavated. The selected
  source IDs are kept in every output's registration record.
- OSM building parts precede whole-building envelopes and relation members.
  Overlapping parts are partitioned horizontally and vertically, preserving
  the base below a raised part. Adjacent identical vertical pieces are merged.
- Heights prefer `height`/`building:height`, then `building:levels * 3m` plus
  tagged roof height, otherwise an explicitly estimated 9m mass (3m for sheds,
  garages, kiosks and roofs). `min_height`/`building:min_level` are respected.
  Original heights and the tagged/levels/estimated distinction remain in data.
- A source-tagged dome uses its footprint bounds and roof height for an
  elliptical dome, not a full-height cylindrical extrusion. Untagged roofs
  remain flat; no ornamental detail is invented.
- Roads and footpaths follow OSM centerlines. Width comes from `width`, lanes
  or an explicit class estimate. Pedestrian polygons and mapped squares are
  retained. This is a flat outdoor context layer, not terrain, routing, traffic,
  bridge-clearance or accessibility data. Underground/indoor records are omitted.
- Walls, city walls, fences, retaining walls and hedges come from mapped
  barriers only. Tagged gate nodes interrupt them. Unknown wall heights are
  estimates, not a claim of measured perimeter security.
- Green areas and water use mapped polygons. Road, path, water and green top
  surfaces are disjoint to avoid Z-fighting. Incomplete source outlines are
  logged; an absent feature is not evidence that none exists on site.

## Runtime and Delivery

- Each context JSON is fetched only when the exterior opens. Browser rendering
  makes no calls to OSM, Overpass, Overture or a third-party tile server.
- Geometry is merged by material into at most eight extra draw batches; toggles
  only change visibility. No renderer or geometry rebuild is needed for a toggle.
- The existing abort, WebGL fallback, off-screen suspension and disposal paths
  cover the environment too. A failed context request does not remove the main
  landmark model. The existing interior 2D default is unchanged.
- All JSON assets are collected by the existing recursive guide precache
  generator when a release is built. Local preview is not itself an assertion
  that a user's offline download is complete.
- Source credit links to https://www.openstreetmap.org/copyright. Source docs:
  https://wiki.openstreetmap.org/wiki/Key:height and
  https://wiki.openstreetmap.org/wiki/Key:building:levels.

## Validation Records

`coverage.json` lists every destination, counts and source issues.
`work/exterior-context-qa/` holds browser screenshots and DOM-derived results.
Desktop and mobile viewport checks are not a substitute for benchmarking an
actual phone. Any unsurveyed registration and missing heights remain explicit.
