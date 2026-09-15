# Exterior Composition Repair: 2026-09-15

Status: repaired locally; production export validated for the requested GitHub
release. Hosting completion and live checks must be verified after this commit.

## Confirmed Defects

- Sforza: the parent castle outline cropped the overhanging crowns of the two
  round towers. Their source parts (`r18022563`, `r18022565`) were not declared
  as owned by the museum model. The context also retained their parent tower
  outlines (`r18022564`, `r18022567`). Clipping only mesh intersections left
  blue-grey shells around the brick towers. Surface intersection alone cannot
  detect a surrounding shell that does not cross the subject's triangles.
- Doges Palace: source part `w810476261` extended outside the parent footprint
  and left a corresponding context fragment.

## Repair

- Preserve the reviewed full building-part footprints for these two museums.
  Keep Correr's existing full-part/ground-outline treatment unchanged.
- Emit the museum's represented part IDs from the shared generator, not only
  from the Correr special case. The existing context generator uses those IDs
  and footprints to suppress duplicate parts and parent-envelope remnants.
- Rebuild only Sforza and Doges Palace GLB, SVG, context and provenance files.
  Sforza retains 236 surrounding building parts, 769 roads and 53 walls; only
  the four duplicate tower IDs were removed from its previous 240 context parts.
  Doges Palace retains 854 surrounding parts, 542 roads and 88 walls; only the
  single duplicate part was removed from its previous 855 context parts.
- Keep original model palettes, source coordinates, neighbouring buildings,
  the Florence rollback, indoor maps and service-worker behaviour unchanged.

## Checks

- New `museum-context.test.ts` failed on both old assets before the repair.
  It now verifies missing duplicate IDs, retained neighbours, and downward
  ray hits on the actual overhang outside the old parent outline.
- Extend the existing whole-catalogue overlap gate with represented-source-ID
  checks using museum provenance and model metadata. This gate runs before
  normal builds and GitHub builds. Do not replace it with a nonblank-canvas test.
- TypeScript and changed-file lint passed. Full suite: 1,178 tests, 78 files.
- Geometry/source audit covers 73 fixed sites: 60 composed subjects, 11
  mapped-area-only scenes and two St Peter views retaining their existing
  separate/unregistered context mode. Gondola is not a fixed building scene.
- Browser coverage: 73 sites x 1440/390 px = 146 cases. Each records initial
  fit, four rotated close-inspection views, isolated subject, layer controls,
  reset, default indoor 2D where applicable, page errors and served-asset hashes.
- Manually reviewed desktop and mobile contact sheets for every fixed site.
  No further duplicate shell of the reported class was identified. Also
  reviewed eight consecutive low-angle rotation frames for each repaired site.
- The main browser run passed 144 cases. Colosseum's two byte-capture checks
  failed because DevTools evicted a large response, not because the renderer
  failed. Both were rerun successfully with exact-byte route capture. Preserve
  the original failures and the separate retest; do not rewrite their history.

## Evidence

- `work/sforza-repair/before-context.png`, `before-subject.png`
- `work/sforza-repair/sforza-low-contact.png`, `doges-palace-low-contact.png`
- `work/exterior-overlap-qa/audit.json`
- `work/exterior-composition-review/report.json` and contact sheets
- `work/exterior-composition-colosseum-retest/report.json` and contact sheets
- Reusable browser runner: `scripts/qa-all-exterior-compositions.mjs`

## Limits

This is an ownership/overlap and visual-composition review, not a new survey
or a guarantee that every roof, height and ornament is accurate. Real adjoining
buildings can obscure the subject at low viewing angles; they were not removed
merely to clear the view. Area-only scenes intentionally have no isolated
landmark. Phone checks use a desktop Chromium phone-sized viewport, not physical
phone hardware. The original local repair did not perform a production build
or deployment. The subsequent requested release is recorded below.

## Release Preparation

- Synced only this repair into the clean release worktree based on `daf2565`;
  the active development server on port 55910 was not rebuilt or restarted.
- Full lint, TypeScript and all 1,178 tests passed again in the release tree.
- `npm run build:github` passed, including the whole-catalogue overlap gate.
  The indoor release gate passed 47/47 entries (42 source-derived maps and
  five explicitly evidence-limited entries, not five completed indoor maps).
- Export cache revision: `e6d2629e09bee2ed14f4`, with 75 guide routes and 1,289
  assets. The five core offline routes remain unchanged.
- Sforza, Doges Palace and Florence Duomo passed production browser checks at
  1440, 1094 and 390 px: fit, rotation, context layers, reset, served-file hashes
  and manually inspected contact sheets. No runtime components were changed.
- A fresh service worker cached every manifest resource. Eight representative
  routes passed real offline refresh. All three subjects then opened their
  current GLB and OSM context offline, with exact cached hashes matching the
  release files; indoor 2D and reviewed entrance defaults were preserved.
- This release-specific offline test is targeted, not a rerun of the previous
  complete 80-route offline matrix. Evidence: `work/repair-release-local/`.
- Florence Duomo remains on the original local model plus OSM. Its model hash
  is `f53dd136ab20e32f1d8f7a0c12d82c15e795ab3b73c38735ebdc078b94b6e34a`.

## CI Follow-Up

- First publishing attempt `34957266782` stopped before deployment: 1,171 tests
  passed; six dense-map integration cases exceeded the default 5-second limit
  and one lazy campus view exceeded Testing Library's 1-second lookup limit.
  The previous production version was not replaced by this failed run.
- Restore the 15-second entry-map test budget previously introduced in
  `f69f6b3`, which the later release had overwritten. Apply the same budget to
  the two other full-plan interaction tests that exceeded 5 seconds, and wait
  up to 10 seconds for the lazy campus view, matching its existing plan wait.
- Cap CI at two workers, matching local full-suite verification. No assertions,
  fixtures, model assets or production components were removed or weakened.
