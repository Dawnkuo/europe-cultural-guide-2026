# Uffizi Collection Review, 2026-09-09

This is an internal review record, not public source or rights copy. It does
not establish full museum coverage or close the whole-site rebuild.

## Scope and Identity

- Retained the original 21 IDs and their order, added 11 distinct works, and
  expanded the 17 previously short old entries. All 32 now have background,
  individual observations, localized archive fields and inspectable images.
- Added northern Renaissance, classical sculpture, artist self-portrait and
  paper-collection entries. This is selected collection breadth, not all
  Uffizi holdings, all rooms or a finished large-museum catalogue.
- Acquisition: `scripts/acquire-uffizi-catalog.mjs` preserves 31 official
  object records with catalogue IDs, source hashes and raw location fields.
  `uffizi-catalog-review.json` retains that evidence independently of public
  translations. Medusa's archive is cross-checked against the museum's
  exhibition/material and inamovible-work records, not a fabricated object ID.
- `scripts/build-uffizi-archive.mjs` generates partial metadata. Runtime merges
  fields within each record; replacing an entire legacy record would erase
  images for works whose new archive entry has no replacement image.

## Interpretation Boundaries

- Gentile's predella Presentation is identified as a replacement for the
  original now in the Louvre. The Lami Adoration is not a direct Medici
  commission; identification of every portrait is not claimed certain.
- Leonardo's Adoration is unfinished, not an intentionally finished brown
  monochrome. Baptism distinguishes documented workshop practice from
  Vasari's attribution anecdote. Goldfinch retains the damage/restoration
  history. Long-Neck Madonna separates deliberate elongation from unfinished
  areas. These are object-specific observations, not one repeated template.
- Urbino diptych and Portinari triptych preserve their reverse faces and the
  different function of each face. Lippi's Madonna is not asserted to be a
  confirmed portrait of Lucrezia. Venus of Urbino admits interpretive debate.
- Medusa's dates remain a range with differing source accounts. Wrestlers
  retains the museum page's conflicting BC/AD accounts rather than selecting
  a convenient date. Niobe and Wrestlers mention restored body parts.
- Medici Venus does not attribute the statue to the signature on a reused
  base. Musical Angel is a fragment, not an intact independent altarpiece.
  Raphael's self-portrait is not confused with a later examination date.
- Three Trees is an identified print in the collection, not a promise of
  permanent display and not assigned to the E7 Rembrandt painting room.

## Locations

The July-labelled 2026 visitor PDF has the same SHA256 as the current
geometry. Visually reviewed page 2 identifies five corrected works, detailed
in `uffizi-room-review.json`. No walls, rooms, closures, itinerary order or
booked times were changed.

There are 29 room references, of which Spring and Birth of Venus retain A9
with an explicit new-installation qualification. The June installation news
describes facing rooms without numbers and conflicts with parts of the PDF
legend. Fortitude and Lami Adoration retain their interpretation but have no
precise position until the new room identity is established. The print also
remains unlocated. A catalogue field alone is not current hanging evidence.

## Images and Visual Review

17 acquired/replaced assets are recorded in `galleries/uffizi-additions.json`.
Original/output hashes and dimensions remain intact. No original image is
enlarged or cropped by acquisition. Wrestlers uses the museum's full statue
exhibition photograph rather than its 653px catalogue thumbnail. Leonardo's
Adoration uses the museum's post-restoration 3712px original, exported at
2000px, replacing the previous 815px image.

Reviewed the current browser captures in
`work/experience/uffizi-collection-room-reviewed`: all 32 primary images in
four contact sheets, all four newly added reverse/detail views, plus full
320px Portinari detail/reading screens, 390px Medici Venus image and 1440px
Medusa detail. Statue heads, bases, whole scenes and altarpiece boundaries
remain visible. Portinari gallery image 3 is an explicitly named right-wing
detail, not a supposedly complete wing. White museum-photo backgrounds and
historic framing are retained rather than replaced with invented content.

A genuine reduced-motion bug caused a transient 1.3x computed transform
after reset despite an inline identity and a 100% label. The global reduced
motion duration was creating a CSS transition on the zoom engine's canvas.
`transition-property: none` now leaves interpolation to the zoom engine.
The regression checks actual computed identity and image containment on
open, reset and gallery changes, not only the zoom label.

## Verification Boundary

Production export `26448c1fe66972c4740f` passes 96 individual work cases
(1440/390/320), and all 32 work deep links first open offline after root
precache. Room round trips, 39 gallery images per viewport, long text,
default reset transform and no overflow/page errors are checked. This is
Chromium with emulated mobile viewports, not physical phone/Safari proof.
Full-page/shared-viewer/all-route checks are recorded in the project progress
log with their own report paths and revision, not inferred from these cases.

No commit, push or public deployment. Unreviewed venues and interpretations
remain outstanding.
