# Museo Correr read-only acceptance

## Verdict

PASS within the pinned official-map scope. No blocking source/model defect was found in the current bytes. Runtime and browser acceptance remain with the main thread.

## Pinned inputs

- Official visitor map: `sources/floorplans/correr.pdf`, page 1, SHA-256 `72a359f7f6f67c405933911997567605f39f1ad34d13de561c06a8dc7ed49006`.
- Config SHA-256: `22196375333cc834317ef6a39724711ecdba550f8dd03ddbd5a65178a1d7130e`.
- Model SHA-256: `ccc366652a0510dd30f5e9726fafe89b2ae27682ced730f9d49ad959d97686a8`.
- Evidence SHA-256: `5db9137373e485c36b94e00b10c5db500c7b8430691465959330d73b3275ffa6`.

## Concrete pass scope

- Both published plan strips are present: `L1` collection/royal level and `L2` picture gallery. The model has 16 places, 9 source-derived spaces, 89 features, one evidenced stair link, and five stop bindings.
- Native `page.get_drawings()` IDs are used. All 26 native fill paths referenced by the nine `sourceSpaces` resolve to the expected generated surface IDs and source-local bounds.
- `L1` structural partitions are separated from stair path 56 and circular floor motif path 82. `L2` partitions are separated from stair/landing paths 238, 240, 242, 243 and 245. The source overlays show the thick partition network retained without promoting service leaders to walls.
- Six service positions match the museum-side endpoints of native leader paths: lift 167, cloakroom 169, store 193, tickets 195, cafe 197 and WC 229. The WC anchor lies inside native fill 228; detached icon frame 205 is not used as the location.
- The central stair connects `L1` to the `L2` picture-gallery landing. The lift is not linked upward because this source does not evidence an upper landing.
- All public floor labels, place names, link labels and limitations are Chinese.

## Bounded limitations

- The official map supplies collection-zone fills, not numbered individual rooms. The model correctly does not claim per-room polygons or invented room numbers.
- Stops 1, 2 and 3 focus collection-level areas: the ballroom is not isolated from the wider Canova/neoclassical zone, and the de' Barbari object is not assigned an unsupported exact wall position. Stop 5, the connected exit segment, remains unbound.
- The small WC source fill overlays the broader Venetian-history color field in the official artwork. This is a legitimate source-layer overlap, not overlapping room geometry.
- Adjacent archaeology and Marciana areas preserve the published footprints; the map does not assert ticket entitlement.

## QA artifacts

- `/tmp/europe-map-current-acceptance/qa/correr-L1-contact.png`
- `/tmp/europe-map-current-acceptance/qa/correr-L2-contact.png`
- `/tmp/europe-map-current-acceptance/qa/correr-L1-classification-overlay.png`
- `/tmp/europe-map-current-acceptance/qa/correr-L2-classification-overlay.png`
