import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const usages = readJson('work/media-review/usage.json');
const dimensions = readJson('app/data/media-dimensions.generated.json');
const precache = readJson('dist/client/guide-precache.json');
const cached = new Set(precache.assets);
const records = [
  ...readJson('sources/media/replacements-applied.json'),
  ...readJson('sources/media/local-replacements-applied.json'),
];
const used = new Set(usages.map((usage) => usage.src));
const failures = [];
for (const src of used) {
  if (!src?.startsWith('/') || !existsSync(`dist/client${src}`)) {
    failures.push(`Missing local production asset: ${src}`);
    continue;
  }
  if (!cached.has(src)) failures.push(`Absent from offline asset list: ${src}`);
  const size = dimensions[src];
  if (!size || Math.max(size.width, size.height) < 640) {
    failures.push(`Missing dimensions or undersized primary image: ${src}`);
  }
}
for (const record of records) {
  if (!used.has(record.path))
    failures.push(`Unused reviewed replacement: ${record.path}`);
  for (const root of ['public', 'dist/client']) {
    const path = `${root}${record.path}`;
    if (!existsSync(path)) {
      failures.push(`Missing reviewed file: ${path}`);
      continue;
    }
    const hash = createHash('sha256').update(readFileSync(path)).digest('hex');
    if (hash !== record.sha256)
      failures.push(`Unreviewed content change: ${path}`);
  }
}
const result = {
  imageOccurrences: usages.length,
  imageBearingPages: new Set(usages.map((usage) => usage.page)).size,
  uniqueRenderedImages: used.size,
  decodedLocalRasterFiles: Object.keys(dimensions).length,
  reviewedReplacementReferences: records.length,
  offlineManifestRevision: precache.revision,
  checks:
    'Local production files, decoded size, reviewed hashes, offline manifest membership. Not browser layout or offline refresh verification.',
  failures,
};
writeFileSync(
  'sources/media/validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
