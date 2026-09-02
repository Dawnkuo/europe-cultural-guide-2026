import { copyFile, cp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const output = join(process.cwd(), 'dist', 'client');
const repository =
  process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'europe-cultural-guide-2026';
const routes = ['bookings', 'cities', 'itinerary', 'sources'];

for (const route of routes) {
  const directory = join(output, route);
  await mkdir(directory, { recursive: true });
  await copyFile(join(output, `${route}.html`), join(directory, 'index.html'));
}

await cp(join(output, repository, '_next'), join(output, '_next'), {
  recursive: true,
});

console.log(
  `Prepared ${routes.length} directory routes and static assets for GitHub Pages.`,
);
