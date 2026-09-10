# Church Exterior Release - 2026-09-10

## Scope

Publish the approved church exterior batch to the existing Europe guide on GitHub
Pages, based on published commit `d62bb2d`. Keep all published itinerary, booking,
indoor spatial data, indoor runtime and entry-floor settings unchanged. The local
upgrade checkout contains additional indoor work with stale acceptance records;
that work is not included in this exterior release. The existing release gate is
unchanged and passes 47/47 records, including its five evidence-limited records.
That gate result is not a new claim that all missing interior geometry is complete.

The batch includes 13 church/religious-site exteriors: approved Milan, nine new
structural massings, retained Pantheon and Sagrada Familia massings, and the
existing local official St Peter exterior asset. The shared exterior renderer also
includes the already implemented Pisa tower, Bridge of Sighs, Braccio Nuovo and
Casa Batllo support on which the current local viewer is based. No indoor route
locations are inferred from exterior geometry; unlocated stops remain a list.

## Verification

- Full release test suite: 49 files, 495 tests passed.
- TypeScript and lint passed.
- GitHub production build: 81 prerendered routes; 74 native guide exports.
- 27 church geometry/fallback/texture assets exactly match their source bytes in
  the production output and are present in the offline manifest.
- Added fresh 2D/entrance-floor regression tests for every available indoor plan.
- Prior local church batch: four desktop views and one mobile view per site,
  nonblank pixel checks, and guide-page integration screenshots. See
  `sources/exteriors/churches/verification.md` for limits and evidence.
- A new interactive browser pass was attempted during release preparation, but
  the Mac was locked and automatic unlock failed. Do not describe that attempt as
  a completed live visual check. Deployment job and public asset checks are
  separate from browser visual checks.

## Reproduction

The production build consumes checked-in GLBs and local textures. Regenerate the
church massings using `node scripts/build-church-exteriors.mjs` on a Node runtime
supporting TypeScript stripping. St Peter's optional acquisition script additionally
requires `meshoptimizer@1.1.1` for encoding; serving and testing its committed GLB
use the decoder already included in Three.js, with no new runtime dependency.
