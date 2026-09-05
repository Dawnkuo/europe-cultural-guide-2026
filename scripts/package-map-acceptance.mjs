import assert from 'node:assert/strict';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { modelDigest, runtimeDigest, requiredMapChecks } from './audit-architectural-migration.mjs';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const geometry = (await read('sources/floorplans/geometry-review.json')).venues;
const release = await read('sources/floorplans/release-review.json');
const offline = await read('work/map-review/offline/report.json');
const layouts = await read('work/map-review/guide-pages-final/report.json');
const manifest = await read('dist/client/guide-precache.json');
const currentRuntime = runtimeDigest();
const output = 'sources/floorplans/rebuild-reports/release';
assert.equal(offline.revision, manifest.revision, 'Offline evidence must match the production build');
assert.deepEqual(offline.missingPrecache, []);
const requiredRoutes = [...new Set(['/', '/itinerary/', '/cities/', '/bookings/', '/vatican-guide/', ...manifest.routes])];
const alphabetic = (left, right) => left.localeCompare(right);
assert.deepEqual(offline.routes.map((r) => r.route).sort(alphabetic), requiredRoutes.sort(alphabetic));
assert(offline.routes.every((r) => r.passed), 'Every exported route must pass offline reload');
assert.equal(layouts.revision, manifest.revision, 'Page screenshots must match the production build');
assert.equal(layouts.pages.length, requiredRoutes.length * 3);
for (const route of requiredRoutes) {
  const pages = layouts.pages.filter((page) => page.route === route);
  assert.deepEqual(pages.map((p) => p.viewport.width), [1440, 1094, 390]);
  assert(pages.every((p) => p.passed && !p.errors.length), `Failed whole-page checks: ${route}`);
}
const packets = [];
for (const file of (await readdir('app/data/architectural-plans')).filter((f) => f.endsWith('.json'))) {
  const model = await read(`app/data/architectural-plans/${file}`);
  const { slug } = model;
  const digest = modelDigest(model);
  const review = geometry[slug];
  assert.equal(review?.modelDigest, digest, `${slug}: stale or missing individual source review`);
  assert.equal(review.sourceDigest, model.sourceDigest);
  assert.deepEqual(review.comparedFloors, model.floors.map((f) => f.id));
  for (const key of ['geometryReview', 'floorCoverageReview', 'stopBindingReview', 'verticalConnectionReview']) assert(review[key]?.length > 30, `${slug}: missing ${key}`);
  const browser = await read(`work/map-review/release-final/${slug}-report.json`);
  const touch = await read(`work/map-review/touch/${slug}.json`);
  const performance = await read(`work/map-review/performance/${slug}.json`);
  const offlineRoute = offline.routes.find((r) => r.route === `/guides/${slug}/`);
  const pages = layouts.pages.filter((p) => p.route === `/guides/${slug}/`);
  assert(pages.every((p) => p.mapSpread > 3), `${slug}: full-page screenshots did not wait for the real map`);
  assert(offlineRoute.routeNumbering, `${slug}: offline guide-number checks missing`);
  for (const [name, report] of Object.entries({ browser, touch, performance, offline: offlineRoute })) assert.equal(report?.modelDigest, digest, `${slug}: stale ${name} evidence`);
  assert.deepEqual(browser.viewports.map((v) => [v.viewport.width, v.viewport.height]), [[1440,1000],[1094,768],[390,844]]);
  for (const viewport of browser.viewports) {
    assert(viewport.passed && viewport.keyboard && viewport.interruptedMouseDrag && !viewport.errors.length, `${slug}: failed browser interaction`);
    assert(viewport.routeNumbering, `${slug}: guide number and unlocated-step checks missing`);
    assert.deepEqual(viewport.floors.map((f) => f.id), model.floors.map((f) => f.id));
    for (const floor of viewport.floors) {
      assert.equal(floor.exactLabels, model.places.filter((p) => p.floorId === floor.id).length);
      assert.equal(floor.guideNumbers, new Set(model.stopBindings.filter((binding) => model.places.find((place) => place.id === binding.placeId)?.floorId === floor.id).map((binding) => binding.placeId)).size);
      assert(floor.minMaxZoom && floor.viewRoundTrip && floor.scrollEdges.x && floor.scrollEdges.y);
    }
    assert.equal(viewport.stopTargets, model.stopBindings.length);
  }
  assert(touch.passed && touch.drag && touch.pinch && touch.cancellationRecovery && !touch.errors.length);
  assert.deepEqual(touch.floorTaps, model.floors.map((f) => f.id));
  assert(performance.emulated30Fps && performance.frameP95Ms <= 34 && !performance.errors.length);
  assert.deepEqual(performance.contexts, { created: 7, lost: 6, live: 1 });
  const packet = { slug, modelDigest: digest, runtimeDigest: currentRuntime, sourceReview: review, browser, touch, performance, fullPages: pages, offline: { revision: offline.revision, ...offlineRoute } };
  packets.push(packet);
  release.venues[slug] = {
    ...review, state: 'verified', runtimeDigest: currentRuntime,
    checks: Object.fromEntries(requiredMapChecks.map((check) => [check, true])),
    runtimeEvidence: `${output}/${slug}.json`,
    performanceScope: `${performance.environment}; p95 ${performance.frameP95Ms.toFixed(1)}ms; seven contexts created, six disposed, one live.`,
    navigationScope: 'Only the source-backed rooms, areas and connections listed in the individual review. Not surveyed distances, live collection positions, access entitlement or turn-by-turn navigation.',
  };
}
// Publish the review registry only after every source and runtime packet passes.
await mkdir(output, { recursive: true });
for (const packet of packets) await writeFile(`${output}/${packet.slug}.json`, JSON.stringify(packet, null, 2) + '\n');
release.note = 'Acceptance is pinned to the exact source/model and shared runtime digests. Source-limited floors and unlocated stops remain explicit; no source gap was filled with a generic interior.';
release.productionRevision = manifest.revision;
await writeFile('sources/floorplans/release-review.json', JSON.stringify(release, null, 2) + '\n');
console.log(`${packets.length} individually source-reviewed models passed current browser, touch, performance and offline checks.`);
