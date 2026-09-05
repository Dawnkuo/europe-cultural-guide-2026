# Teatro La Fenice read-only acceptance

## Verdict

PASS within the three pinned plan extracts and their explicit limitations. No blocking source/model defect was found in the current bytes. Runtime and browser acceptance remain with the main thread.

## Pinned inputs

- 2023 measured-current-state thesis: `sources/floorplans/fenice-thesis-2023.pdf`, page 33 figure 29, SHA-256 `d170c145ce13217b6082489e0f48217a3de3d8b72077f0723ca02c9bbfb7b0ff`.
- 2018 museum thesis: `sources/floorplans/fenice-museum-thesis-2018.pdf`, pages 202-203, SHA-256 `559f1ce49f1fbed14f5bf4b0a96e0e2f98fa45d03fd3cc7344279a04a2e7f779`.
- Config SHA-256: `4bf1923befaf6be0f71cd2224032398535a7b490d03264142fd846e9acaf6a87`.
- Model SHA-256: `ac2e228c94875716354c3838d4f32642d8359002fbb24d2ce006121bdc498088`.
- Evidence SHA-256: `ad3ec5ba54fd9e26e6cd61d70a0cd9e2e2badc263a5dfa7367fa14d166a4f85d`.

## Concrete pass scope

- Three independent diagrams are present: complete foyer level, first-tier auditorium extract, and complete Sale Apollinee level. The model has 10 places, 8 room-scoped spaces, 1,887 features and nine bindings.
- Foyer walls/columns are separated from door swings, stairs, dimensions, labels and furniture. The selectable foyer face follows the reviewed source-white central hall and does not cross wall pixels.
- Auditorium neutral-grey structural masses are retained as walls. Stage gradient shading is excluded from structure, and stairs remain flat. The platea face follows the source boundary; the first-tier space contains exactly 30 non-overlapping source box components.
- Thin radial box separators remain flat because the source does not encode their thickness as grey wall mass. Rear/perimeter structural masses are raised; no unsupported generic wall thickness is added.
- All five named Apollinee halls have separate source-white faces: Grande, Sinopoli, Verdi, Ammannati and Dante. Their true corners, service-core exclusions and doorway closures pass source-boundary, containment, non-overlap and wall-crossing checks.
- The independent Fenice regression passes 2,123 source-coordinate semantic assertions, including walls, details, annotation exclusions, voids, selection-only doorway closures, serialized polygon validity and room-face bounds.
- Stop indexes 1, 2 and 4 are bound to evidenced interior locations. All public floor/place/limitation text is Chinese.

## Bounded limitations

- Stop 0 is the exterior Campo San Fantin facade and has no indoor binding. Stop 3, the Royal Box, remains unbound because figure 29 is the first tier and the thesis locates the imperial loggia on higher tiers. Stop 5, the canal water gate, is outside the reviewed crops.
- The stage keeps an evidence-backed area anchor but has no selectable face because the only available source treatment is a gradient, not a separable complete floor boundary.
- No vertical link is asserted. The 2018 grand-stair account and the 2023 current north-wing access description do not provide a shared labelled shaft across these independently drawn levels.
- `floorplan-availability.json` still calls the legacy generic plan `source-limited`; the installed architectural JSON is loaded through `architectural-plan-loader.ts` and is not gated by that legacy status.

## QA artifacts

- `/tmp/europe-map-current-acceptance/qa/fenice-foyer-contact.png`
- `/tmp/europe-map-current-acceptance/qa/fenice-auditorium-contact.png`
- `/tmp/europe-map-current-acceptance/qa/fenice-apollinee-contact.png`
- `/tmp/europe-map-current-acceptance/qa/fenice-foyer-classification-overlay.png`
- `/tmp/europe-map-current-acceptance/qa/fenice-auditorium-classification-overlay.png`
- `/tmp/europe-map-current-acceptance/qa/fenice-apollinee-classification-overlay.png`
