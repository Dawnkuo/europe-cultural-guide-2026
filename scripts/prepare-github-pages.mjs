import { copyFile, cp, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { generateGuidePrecache } from './generate-guide-precache.mjs';

const output = join(process.cwd(), 'dist', 'client');
const repository =
  process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'europe-cultural-guide-2026';
const routes = ['bookings', 'cities', 'guides', 'itinerary', 'vatican-guide'];

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

const guideRoutes = await generateGuidePrecache({
  output,
  slugs: guidePages.map((page) => page.slice(0, -'.html'.length)).sort(),
});

await cp(join(output, repository, '_next'), join(output, '_next'), {
  recursive: true,
});

console.log(
  `Prepared ${routes.length} top-level routes and ${guideRoutes.length - 1} native guide routes for GitHub Pages.`,
);
