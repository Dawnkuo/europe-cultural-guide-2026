import { copyFile, cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateGuidePrecache } from './generate-guide-precache.mjs';
import { pruneProductionResources } from './prune-production-resources.mjs';

const output = join(process.cwd(), 'dist', 'client');
const repository =
  process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'europe-cultural-guide-2026';
const routes = ['bookings', 'cities', 'guides', 'itinerary', 'vatican-guide', 'photo-spots'];

for (const route of routes) {
  const directory = join(output, route);
  await mkdir(directory, { recursive: true });
  await copyFile(join(output, `${route}.html`), join(directory, 'index.html'));
}

const guideOutput = join(output, 'guides');
const guidePages = (await readdir(guideOutput)).filter(
  (file) => file.endsWith('.html') && file !== 'index.html',
);

for (const page of guidePages) {
  const slug = page.slice(0, -'.html'.length);
  const directory = join(guideOutput, slug);
  await mkdir(directory, { recursive: true });
  await copyFile(join(guideOutput, page), join(directory, 'index.html'));
}

await cp(join(output, repository, '_next'), join(output, '_next'), {
  recursive: true,
});

const cleanup = await pruneProductionResources({ output, appRoot: join(process.cwd(), 'app'), nestedExportDirectory: repository });
const reportDirectory = join(process.cwd(), 'work', 'production-cleanup');
await mkdir(reportDirectory, { recursive: true });
await writeFile(join(reportDirectory, 'pruned.json'), `${JSON.stringify(cleanup, null, 2)}\n`);

const guideRoutes = await generateGuidePrecache({
  output,
  slugs: guidePages.map((page) => page.slice(0, -'.html'.length)).sort(),
  nestedExportDirectory: repository,
  extraRoutes: ['/photo-spots/'],
  serviceWorkerTemplate: await readFile(join(process.cwd(),'public/sw.js'),'utf8'),
});

console.log(
  `Prepared ${routes.length} top-level routes and ${guidePages.length} native guide routes for GitHub Pages (${guideRoutes.length} manifest routes).`,
);
console.log(`Removed ${cleanup.removed.length} redundant export files (${(cleanup.removedBytes / 1_000_000).toFixed(1)} MB). Source assets are unchanged.`);
