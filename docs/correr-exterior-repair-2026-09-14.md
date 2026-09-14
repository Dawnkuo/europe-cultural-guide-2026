# Correr Facade And Surface Repair

Scope: local `/guides/correr#guide-spatial`, including the museum asset and its
OSM context. No itinerary, other museum assets, indoor maps or deployment changed.

## Defects Reproduced

- The outline-minus-parts remainder was 60.79 square metres spread across narrow
  fragments. Extruding every fragment to the fallback height of 22 m produced
  unsupported facade fins, including fragments taller than adjacent roofs.
- Clipping source building parts against the slightly different detailed parent
  outline broke long facade edges into short segments, interrupting window rows.
- The previous coplanar check omitted windows and cornices. Integer polygon
  subtraction could also leave touching outer/hole rings which Earcut filled
  incorrectly, reintroducing overlap at a flat roof and cornice junction.
- The street-context generator independently retained thin residuals of the same
  source parts as grey buildings. The existing overlap audit eroded neighbours
  by 5 cm for party-wall contact and therefore missed these thin coincident faces.
  The final context-on screenshot, not the model-only screenshot, exposed this.

## Correction

- All 17 selected height-tagged OSM parts remain in the model, using their original
  part geometry. The parent outline is retained at ground level, not interpreted
  as dozens of independently measured full-height buildings.
- Gabled roof polygons are split at their ridge before triangulation.
- Coplanar partitioning includes cornices and window panels. Touching rings are
  normalized into simple polygons before triangulation; no depth-test bypass or
  global shadow removal is used.
- The asset records its represented source part IDs. Context generation excludes
  those IDs and their footprints, preventing the same structure from being
  rebuilt as thin grey blocks. Other assets without this metadata retain their
  previous context-generation path.
- The output remains schematic: window rhythms, ornament and some dimensions
  are not a surveyed reconstruction. This repair does not add a detailed arcade.

## Verification

- 119 tests passed across Correr surfaces, museum assets and the full exterior
  overlap audit. Correr-specific checks cover all represented parts, ground-only
  outline remnants, absence of duplicate context IDs, 60 exposed window samples,
  and coplanar faces including windows/cornices.
- Browser QA at 1440 and 390 CSS pixels: eight context-on views, eight model-only
  views and twelve low-angle rotation frames per viewport; drag, zoom, reset,
  nonblank canvas, initial framing and no horizontal page overflow.
- Browser responses for both the GLB and context JSON match local SHA-256 hashes.
  Reports and images are in `work/correr-roof-qa/`. The former screenshot-only
  PASS was insufficient; the new screenshots were also visually reviewed.
- TypeScript, scoped lint and production build passed. Post-build local bookings
  and Correr navigation/rendering passed without page errors.
- Mobile checks use Chrome viewport/touch emulation, not a physical phone.
- Not deployed to GitHub.
