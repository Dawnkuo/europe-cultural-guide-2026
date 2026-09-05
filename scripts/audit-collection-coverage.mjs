import { access, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true },
});
try {
  const { guideCatalog } = await vite.ssrLoadModule('/app/data/guides.ts');
  const { collectionExpansion } = await vite.ssrLoadModule(
    '/app/data/guides/expanded.ts',
  );
  const precache = JSON.parse(
    await readFile('dist/client/guide-precache.json', 'utf8'),
  );
  const cached = new Set(precache.assets);
  const failures = [];
  const unillustrated = [];
  for (const guide of guideCatalog) {
    for (const item of guide.highlights) {
      if (!item.image) {
        unillustrated.push({
          slug: guide.slug,
          id: item.id,
          title: item.title,
          note: item.displayNote,
        });
        if (!item.displayNote)
          failures.push(`Unexplained missing image: ${item.id}`);
        continue;
      }
      try {
        await access(`dist/client${item.image}`);
      } catch {
        failures.push(`Missing production image: ${item.image}`);
      }
      if (!cached.has(item.image))
        failures.push(`Not precached: ${item.image}`);
    }
  }
  const report = {
    guideCount: guideCatalog.length,
    expandedGuideCount: Object.keys(collectionExpansion).length,
    authoredAdditions: Object.values(collectionExpansion).flat().length,
    totalHighlights: guideCatalog.reduce(
      (sum, guide) => sum + guide.highlights.length,
      0,
    ),
    distinctRenderedImages: new Set(
      guideCatalog.flatMap((g) =>
        g.highlights.flatMap((h) => (h.image ? [h.image] : [])),
      ),
    ).size,
    counts: Object.fromEntries(
      guideCatalog.map((g) => [g.slug, g.highlights.length]),
    ),
    unillustrated,
    failures,
    checks:
      'Every highlight, including later browser pages: production file exists and is listed in the offline manifest. Not a browser offline-refresh or visual-layout test.',
  };
  await writeFile(
    'sources/collections/coverage.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exitCode = 1;
} finally {
  await vite.close();
}
