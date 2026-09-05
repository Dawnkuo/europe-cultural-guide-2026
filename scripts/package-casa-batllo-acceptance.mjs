// Targeted acceptance; unchanged venues retain dated evidence only after an
// exact source reversal proves the optional display branch preserves defaults.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { mapRuntimeFiles, modelDigest, requiredMapChecks, runtimeDigest } from './audit-architectural-migration.mjs';

const base = '5db44c04174422c4656e258c7df1f2e1f9b03c31';
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const oldText = path => execFileSync('git', ['show', `${base}:${path}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const write = (path, data) => writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
const oldRuntimeHash = createHash('sha256');
const helper = `\nexport function planFloorGap(plan: ArchitecturalPlan) {\n  const gap = plan.display?.floorGap;\n  return typeof gap === 'number' && Number.isFinite(gap) && gap >= 3 && gap <= 10 ? gap : 7.5;\n}\n`;
for (const path of mapRuntimeFiles) {
  const previous = oldText(path);
  oldRuntimeHash.update(path).update('\0').update(previous).update('\0');
  let current = readFileSync(path, 'utf8');
  if (path === 'app/components/ArchitecturalScene.tsx') {
    current = current.replace('independentFloorScale, planFloorGap,', 'independentFloorScale,').replace('index*planFloorGap(plan)', 'index*7.5');
  } else if (path === 'app/lib/architectural-plan.ts') {
    assert(current.includes(helper));
    current = current.replace('  display?: { floorGap: number };\n', '').replace(helper, '');
  } else if (path === 'app/data/architectural-map-notes.json') {
    const before = JSON.parse(previous), after = JSON.parse(current);
    delete before['casa-batllo']; delete after['casa-batllo'];
    assert.deepEqual(after, before, 'Another venue changed its displayed notes');
    continue;
  }
  assert.equal(current, previous, `Unreviewed shared runtime change: ${path}`);
}
const previousRuntime = oldRuntimeHash.digest('hex');
const currentRuntime = runtimeDigest();
const geometryPath = 'sources/floorplans/geometry-review.json';
const releasePath = 'sources/floorplans/release-review.json';
const geometry = read(geometryPath), release = JSON.parse(oldText(releasePath));
const plan = read('app/data/architectural-plans/casa-batllo.json');
const digest = modelDigest(plan);
const qa = 'work/casa-nine-levels';
const browser = read(`${qa}/browser-final/casa-batllo-report.json`);
const touch = read('work/map-review/touch/casa-batllo.json');
const performance = read('work/map-review/performance/casa-batllo.json');
const offlineReport = read(`${qa}/offline/report.json`);
const offline = offlineReport.routes.find(r => r.route === '/guides/casa-batllo/');
const pages = read(`${qa}/pages/report.json`);
const revision = read('dist/client/guide-precache.json').revision;
assert.equal(offlineReport.revision, revision);
assert.equal(pages.revision, revision);
assert.deepEqual(offlineReport.missingPrecache, []);
assert(pages.pages.every(p => p.passed && !p.errors.length));
for (const report of [browser, touch, performance, offline]) assert.equal(report.modelDigest, digest);
assert.equal(plan.floors.length, 9);
assert.equal(plan.display.floorGap, 3.5);
assert.equal(browser.viewports.length, 3);
for (const viewport of browser.viewports) {
  assert(viewport.passed && viewport.keyboard && viewport.interruptedMouseDrag && viewport.routeNumbering && !viewport.errors.length);
  assert.deepEqual(viewport.floors.map(f => f.id), plan.floors.map(f => f.id));
  for (const floor of viewport.floors) {
    assert.equal(floor.exactLabels, plan.places.filter(p => p.floorId === floor.id).length);
    assert(floor.minMaxZoom && floor.viewRoundTrip && floor.scrollEdges.x && floor.scrollEdges.y);
  }
  assert.equal(viewport.stopTargets, plan.stopBindings.length);
}
assert(touch.passed && touch.drag && touch.pinch && touch.cancellationRecovery && !touch.errors.length);
assert.deepEqual(touch.floorTaps, plan.floors.map(f => f.id));
assert(performance.emulated30Fps && performance.frameP95Ms <= 34 && !performance.errors.length);
assert.deepEqual(performance.contexts, { created: 7, lost: 6, live: 1 });
assert(offline.passed && offline.routeNumbering && !offline.errors.length);
const review = {
  geometryReview: 'Visually compared all nine plan levels against both pinned 2000px architect-supplied KKAA plates and the longitudinal section. Orthographic crops preserve equal-axis source geometry. Thick neutral cut masonry is separate from flat treads, ceiling projections, glazing and furniture. Ten strictly closed source-white components provide selective floor surfaces; unknown open faces are not invented.',
  floorCoverageReview: 'Nine plan levels: basement, ground, noble, first, second, third, fourth, attic and rooftop. The publication explicitly assigns the first-through-third common drawing to three levels. Roof is not counted as an enclosed storey. Current 2026 private rooms and temporary-exhibition partitions are not asserted by this 2021 source.',
  stopBindingReview: 'Original six guide steps retained. Steps 1-3 are rebound to the newer ground/noble plans, steps 4-5 now locate the attic and rooftop. Step 6 remains unlocated because exact current exhibit-room assignments, including Cube and Dome, are not established. No ticket or itinerary data changed.',
  verticalConnectionReview: 'Seven consecutive stair-core links from basement through attic are supported by the matching plan cores and continuous longitudinal stair section. Two separately drawn spiral stairs link attic and rooftop. These are topological selection links, not surveyed shafts or a promise of public access.',
  modelDigest: digest, sourceDigest: plan.sourceDigest,
  sourceEvidence: 'sources/floorplans/evidence/casa-batllo.json',
  comparedFloors: plan.floors.map(f => f.id),
};
geometry.venues['casa-batllo'] = review;
const packetPath = 'sources/floorplans/rebuild-reports/release/casa-batllo.json';
write(packetPath, { slug: plan.slug, modelDigest: digest, runtimeDigest: currentRuntime, sourceReview: review, browser, touch, performance, fullPages: pages.pages.filter(p => p.route === '/guides/casa-batllo/'), offline: { revision, ...offline } });
release.venues['casa-batllo'] = {
  ...review, state: 'verified', runtimeDigest: currentRuntime,
  checks: Object.fromEntries(requiredMapChecks.map(check => [check, true])),
  runtimeEvidence: packetPath,
  performanceScope: `${performance.environment}; p95 ${performance.frameP95Ms.toFixed(1)}ms; one live WebGL context after seven mounts.`,
  navigationScope: '2021 architecture and documented stair connections; not current exhibit-room positions, surveyed distances or admission rights.',
};

const equivalencePath = 'sources/floorplans/rebuild-reports/casa-batllo-default-runtime-equivalence.json';
write(equivalencePath, {
  baseCommit: base, previousRuntimeDigest: previousRuntime, runtimeDigest: currentRuntime,
  proof: 'Exact source reversal verified: scene replaces only index*7.5 with planFloorGap(plan); unchanged models have no display field, so the helper returns exactly 7.5. All remaining scene source is byte-identical. Other shared runtime files are identical after removal of that helper/type field; per-venue notes are deep-equal. Prior evidence retains its dates; this is not a fresh whole-site run.',
  freshRegressionPages: pages.pages.filter(p => p.route !== '/guides/casa-batllo/'),
});
for (const [slug, entry] of Object.entries(release.venues)) {
  if (slug === 'casa-batllo' || entry.state !== 'verified') continue;
  const path = `app/data/architectural-plans/${slug}.json`;
  const current = read(path), previous = JSON.parse(oldText(path));
  assert.deepEqual(current, previous, `Unreviewed model change: ${slug}`);
  assert.equal(current.display, undefined, `${slug} now uses the new display branch`);
  assert.equal(entry.runtimeDigest, previousRuntime);
  assert.equal(entry.modelDigest, modelDigest(current));
  const carryForward = { evidence: equivalencePath, previousRuntimeDigest: previousRuntime };
  entry.runtimeDigest = currentRuntime;
  entry.runtimeCarryForward = carryForward;
  const packet = read(entry.runtimeEvidence);
  packet.runtimeDigest = currentRuntime;
  packet.runtimeCarryForward = carryForward;
  write(entry.runtimeEvidence, packet);
}
release.productionRevision = revision;
release.note = 'Casa Batllo has fresh nine-level source, browser, touch, performance and offline acceptance. Other venue evidence retains its dated provenance with a checked default-branch equivalence record; no claim that all 2026 exhibition layouts have been surveyed.';
write(geometryPath, geometry);
write(releasePath, release);
console.log('Casa Batllo acceptance packaged; unchanged default-branch venue evidence explicitly carried forward.');
