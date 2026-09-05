# Collection Expansion Review

Date: 2026-09-05

## Scope

- Audited the 74 attraction chapters. The original catalog contained 232 highlights; 71 chapters had exactly three.
- Added 168 individually authored records across 30 chapters. Removed two composite rows when replacing them with individually identified works. Final total: 398 highlights.
- This is a curated collection and architectural guide, not an inventory of every institutional holding. The UI has no three-item or ten-item ceiling.
- Itinerary visits, booking data, chapter order, spatial geometry and route steps are unchanged by collection enrichment.

## Content Integrity

- Every addition has an immutable ID, original title, factual source record, subject-specific interpretation, significance and concrete observation prompts.
- Reviewed assets are matched by explicit keys, never by array order. Legacy positional media is attached before composite captions are split.
- Split Botticelli's Primavera / Birth of Venus, the six Borghese Caravaggios, the Cologne Gero / Richter group, and the two Medici ducal tombs.
- Margot / Waiting remains one Picasso painting. Palazzo Citterio works are not presented as located in the old Brera building.
- Retain non-displayed holdings in the guide with notes: Vitruvian Man, San Giobbe restoration, Borghese Melissa in storage. Do not promise access to the Holy Door or Petit Palau.
- Corrected the Accademia Sabines model material to unfired clay. Distinguish the Colonia Guell hanging model from a Sagrada Familia building model.
- Removed the onsite-mode modulo assignment, which had implied that unrelated works belonged to route stops. Only explicit `highlightIds` can produce an onsite work association.

## Image Review

- Asset researchers inspected downloaded originals. Parent also reviewed all 167 initial derivatives on 14 legible, uncropped sheets, plus suspect images individually.
- Derivatives keep the full source framing, correct aspect ratio and source watermarks. Bounded proportional resize to 1800px, JPEG quality 93, no enlargement, artificial sharpening or generated reconstruction.
- Rejected the distant Trivulzio candelabrum silhouette. A bounded search did not yield a sufficiently clear high-resolution alternative; its factual description remains text-only.
- Rejected the black-and-white Sleeping Cupid archival reproduction for a colour painting guide. Its factual description remains text-only.
- Replaced the Castor-and-Pollux sunset silhouette with an individually inspected daylight close view of the capitals and shafts. Caption explicitly identifies the detail framing.
- The Medici portrait, Duomo stained-glass panels, Doge's Palace ceiling detail, Nativity sculpture and Sala delle Asse fragment are labelled as details, not whole-room images.
- Full source records and rights statements are retained in `manifests/`; public availability is not claimed to confer publication rights. This turn does not publish the assets.

## Interaction And Release

- More than six highlights use search, category filtering, eight-item pagination and a native modal with full image and text. All records remain accessible, including direct `#work-ID` links beyond the first page.
- Automated coverage checks every record and every production image, including images not present on the first rendered page.
- Tests cover pagination, search, categories, no-results state, matching detail, deep links, closing/focus restoration and honest missing-image handling.
- Browser visual inspection, actual pointer/keyboard behaviour and offline refresh remain blocked: CUA reports that the Mac is locked and automatic unlock failed. DOM tests are not substituted for those checks.
- No GitHub deployment in this turn. The worktree also contains an unfinished independent map migration; it must not be published as complete.

## Final Automated Verification

- Vitest: 205 tests across 34 files passed. TypeScript, lint and `git diff --check` passed.
- GitHub Pages production build: 81 routes prerendered successfully. Existing large-map bundle warnings remain outside this content expansion.
- Collection coverage: 398 highlights across 74 chapters, including all later result pages; 396 distinct local highlight images and two explicit text-only records. Production-file and offline-manifest checks reported zero failures.
- Raster/media audit: 603 local raster files decode; all 72 previously reviewed replacement references retain their verified hashes. This expansion installs 166 reviewed derivatives.
- Local `/guides/uffizi/` returned HTTP 200. Final CUA retry timed out after 30 seconds; actual browser layout, interaction and offline refresh are still unverified.

Exact counts and production/offline membership results: `coverage.json`. Installed image hashes and sizes: `installed.json`.
