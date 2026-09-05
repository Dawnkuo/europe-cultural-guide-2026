import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const requiredMapChecks = ['sourceGeometry', 'floorCoverage', 'roomIdentifiers', 'stopBindings', 'verticalConnections', 'desktop', 'portrait', 'keyboard', 'interruptedDrag', 'offline', 'performance'];

export function modelDigest(model) {
  return createHash('sha256').update(JSON.stringify(model)).digest('hex');
}

export function migrationRows(inventory, models, reviews) {
  return Object.keys(inventory).sort().map((slug) => {
    const model = models.find((candidate) => candidate.slug === slug);
    const review = reviews[slug];
    const verified = model && review?.state === 'verified' && review.sourceDigest === model.sourceDigest && review.modelDigest === modelDigest(model) && requiredMapChecks.every((check) => review.checks?.[check] === true);
    const limited = !model && review?.state === 'evidence-limited' && review.reason?.length > 20 && review.inspectedSources?.length > 0;
    return {
      slug,
      status: verified ? 'verified' : limited ? 'evidence-limited' : model ? 'draft' : 'not-rebuilt',
      floors: model?.floors.length ?? 0,
      places: model?.places.length ?? 0,
      boundStops: model?.stopBindings.length ?? 0,
      links: model?.verticalLinks.length ?? 0,
      releaseReady: Boolean(verified || limited),
    };
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const root = process.cwd();
  const read = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
  const models = readdirSync(join(root, 'app/data/architectural-plans')).filter((name) => name.endsWith('.json')).map((name) => read(`app/data/architectural-plans/${name}`));
  const rows = migrationRows(read('app/data/floorplan-availability.json'), models, read('sources/floorplans/release-review.json').venues);
  console.table(rows);
  const pending = rows.filter((row) => !row.releaseReady);
  console.log(`${models.length} source-derived drafts; ${rows.length - pending.length}/${rows.length} attractions passed the release gate.`);
  if (process.argv.includes('--release') && pending.length) {
    console.error('Deployment blocked: indoor map migration and acceptance remain incomplete.');
    process.exitCode = 1;
  }
}
