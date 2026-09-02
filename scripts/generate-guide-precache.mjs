import { access, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function generateGuidePrecache({ output, slugs }) {
  const guideRoot = join(output, 'guides');
  const requested =
    slugs ??
    (await readdir(guideRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

  await access(join(guideRoot, 'index.html'));
  for (const slug of requested) {
    try {
      await access(join(guideRoot, slug, 'index.html'));
    } catch {
      throw new Error(`Missing exported guide route: ${slug}`);
    }
  }

  const routes = ['/guides/', ...requested.map((slug) => `/guides/${slug}/`)];
  await writeFile(
    join(output, 'guide-precache.json'),
    `${JSON.stringify({ version: 1, routes }, null, 2)}\n`,
  );
  return routes;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const output = join(process.cwd(), 'dist', 'client');
  const routes = await generateGuidePrecache({ output });
  console.log(`Prepared ${routes.length} offline guide routes.`);
}
