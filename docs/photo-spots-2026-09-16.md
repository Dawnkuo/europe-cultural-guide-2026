# Photography Viewpoints

Local-only expansion on 2026-09-16. No deployment was requested. The earlier
16-photo / 19-guide implementation was an insufficient prototype.

## Current Inventory

### Itinerary Ordering

The directory is ordered by its linked itinerary date, then original item order.
Alternatives follow the scheduled items on the same day. Unspecified times keep
their source position and are not parsed into artificial clock times. Repeated
visits remain visible on one photo card; the first visit controls ordering.

The server derives minimal date/time/order props from the canonical trip and
guide-to-item mapping. No complete guide, booking or itinerary object is added
to the photo client bundle. Shooting-location bindings distinguish the Scala
museum from the evening performance, the inside Bridge of Sighs from its exterior
stop, and Cologne's riverside from the following day's cathedral interior.
Filters, reloads and offline views retain the same itinerary ordering.

- 99 distinct reference photos: 51 indoor, 42 outdoor, 6 roof/observation viewpoints.
- All 74 itinerary guide chapters have at least one associated reference. This
  does not mean every room, work, camera angle, or permission is verified.
- Paris 4; Milan 9; Venice 13; Florence 14; Pisa 8; Rome/Vatican 21; Barcelona 23; Cologne 7.
- Local WebP photos total 25,939,004 bytes and preserve uncropped composition.
- Indoor entries identify rooms and relative standing positions, direction,
  composition and access. Indoor map links locate the venue, not invented floor GPS.
- Hash-based city, guide, indoor/outdoor/terrace and text filters preserve offline
  deep links and reload. Counts derive from the complete inventory.
- Fixed five-item navigation, itinerary, bookings, map defaults and models are unchanged.

## Evidence Boundaries

- Last Supper: exterior only; refectory reference and current photo permission pending.
- Vasari Corridor: bridge-level exterior, not an indoor photograph.
- Picasso Barcelona: palace courtyard, not a collection gallery.
- Vatican: Rotunda, Gallery of Maps and modern exit stairs; no Sistine Chapel
  viewpoint because visitor photography is prohibited.
- 27 indoor entries still lack a verified official photo policy and explicitly
  require confirmation. Other entries cite rules, including conditional access.
  A licensed reference photo is not a visitor photography permit.
- Historical photos, changing displays, elevated viewpoints, separate admission,
  HDR processing and uncertain room numbers are labelled.
- Standing text is editorial inference from the photographed spatial relationships,
  not surveyed coordinates or a guarantee of current access.

## Provenance

Content lives in app/data/photo-spots.ts and photo-spots-expanded.ts;
photo-policies.ts contains official rule links and check dates;
photo-coverage.ts records remaining indoor gaps.

The 83 additions were selected by visual review of candidate sheets under
work/photo-expansion/. Drawings, copies, wrong locations and mismatched rooms were
rejected. Exact selections are in sources/photography/expansion-selections.json.
Raw Commons metadata is retained under sources/photography/expanded/.
metadata-overrides.json records manually checked missing author credit with a
source, never an assumed uploader. Media hashes and licenses are tested.

Run node scripts/audit-photo-coverage.mjs for the per-guide inventory in
sources/photography/coverage-review.json.

## Verification

- Unit/integration suite: 82 files, 1,274 tests passed.
- Type check and scoped lint passed.
- Build log: work/photo-expansion/build-order.log.
- Current browser results: work/photo-spots-review/report.json.
- Browser coverage: 320, 390, 768, 1094 and 1440 CSS-pixel widths; city filters;
  all 74 guide filters on phone; indoor filter/reload; empty results; all images;
  zoom/Escape/focus and two-way guide links. All directory/filter/reload states
  verify itinerary order and every displayed visit date against the canonical trip.
- Offline test: precache at homepage, disconnect before first photo-page visit,
  then exercise deep-link reload, images, indoor filters and first lazy zoom load.
  External maps and source destinations still require a connection.
- Phone tests emulate Chromium viewports, not physical iOS/Android devices.

After building, run node scripts/qa-photo-spots.mjs and
node scripts/qa-site-navigation.mjs. Verify the report revision matches the export.
