import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { mapRuntimeFiles, modelDigest, runtimeDigest, requiredMapChecks } from './audit-architectural-migration.mjs';

const base = process.argv[2];
assert.ok(base, 'Pass the reviewed base commit explicitly');
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const prior = createHash('sha256');
const unchanged = {};
const changed = {};
for (const path of mapRuntimeFiles) {
  const before = execFileSync('git', ['show', `${base}:${path}`]);
  const after = await readFile(path);
  prior.update(path).update('\0').update(before).update('\0');
  if (path === 'public/sw.js') changed[path] = { before: hash(before), after: hash(after) };
  else {
    assert.ok(before.equals(after), `Not an offline-only runtime update: ${path}`);
    unchanged[path] = hash(after);
  }
}
const previousRuntimeDigest = prior.digest('hex');
const currentRuntimeDigest = runtimeDigest();
const manifest = await json('dist/client/guide-precache.json');
const template = await readFile('public/sw.js', 'utf8');
assert.equal(await readFile('dist/client/sw.js', 'utf8'), template.replace(/const CACHE = '(europe-cultural-guide-v\d+)';/, `const CACHE = '$1-${manifest.revision}';`));
const offline = await json('work/offline-resume-all-routes/report.json');
const resume = await json('work/offline-resume/report.json');
assert.equal(offline.revision, manifest.revision);
assert.equal(resume.revision, manifest.revision);
assert.ok(resume.passed && resume.errors.length === 0);
assert.ok(resume.steps.some(step => step.name === 'real network disconnect during active downloading preserves progress'));
assert.ok(resume.steps.some(step => step.name === 'browser restart restores the persisted cache'));
assert.deepEqual(offline.missingPrecache, []);
const compareRoutes = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const routes = [...new Set(['/', '/itinerary/', '/cities/', '/bookings/', '/vatican-guide/', ...manifest.routes])].sort(compareRoutes);
assert.deepEqual(offline.routes.map(route => route.route).sort(compareRoutes), routes);
assert.ok(offline.routes.every(route => route.passed && route.errors.length === 0));
const registry = await json('sources/floorplans/release-review.json');
const evidencePath = 'sources/floorplans/rebuild-reports/offline-resume-runtime.json';
const venues = [];
for (const file of (await readdir('app/data/architectural-plans')).filter(path => path.endsWith('.json'))) {
  const model = await json(`app/data/architectural-plans/${file}`);
  const review = registry.venues[model.slug];
  assert.equal(review.runtimeDigest, previousRuntimeDigest);
  assert.equal(review.state, 'verified');
  assert.equal(review.modelDigest, modelDigest(model));
  assert.equal(review.sourceDigest, model.sourceDigest);
  assert.ok(requiredMapChecks.every(check => review.checks[check]));
  const test = offline.routes.find(route => route.route === `/guides/${model.slug}/`);
  assert.equal(test.modelDigest, review.modelDigest);
  assert.ok(test.default2d && test.routeNumbering);
  venues.push({ slug: model.slug, modelDigest: review.modelDigest, priorRuntimeEvidence: review.runtimeEvidence, offline: test });
  review.runtimeDigest = currentRuntimeDigest;
  review.runtimeEquivalenceEvidence = evidencePath;
}
await writeFile(evidencePath, JSON.stringify({
  scope: 'Only the offline worker changed in the pinned map runtime. Geometry, styles, controls, source plans and dependency lock are byte-identical to the reviewed base. Prior visual/touch/performance evidence is retained, not claimed as freshly rerun. Every offline route and the resumable downloader were re-tested.',
  base, previousRuntimeDigest, currentRuntimeDigest, revision: manifest.revision,
  unchanged, changed, resume, offlineRoutes: routes.length, venues,
}, null, 2) + '\n');
registry.productionRevision = manifest.revision;
await writeFile('sources/floorplans/release-review.json', JSON.stringify(registry, null, 2) + '\n');
console.log(`Recorded fresh offline evidence for ${venues.length} unchanged maps and ${routes.length} routes.`);
