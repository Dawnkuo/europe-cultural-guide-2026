import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const vite = await createServer({ configFile: false, cacheDir: 'node_modules/.vite-experience-audit', server: { middlewareMode: true } });
try {
  const { guideCatalog } = await vite.ssrLoadModule('/app/data/guides.ts');
  const guides = [];
  for (const guide of guideCatalog) {
    let plan;
    try { plan = JSON.parse(await readFile(`app/data/architectural-plans/${guide.slug}.json`, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    guides.push({
      slug: guide.slug, title: guide.title, sources: guide.sources,
      highlights: guide.highlights.map((work, index) => ({ ...work, id: work.id ?? `${guide.slug}-highlight-${index + 1}` })),
      sequence: guide.sequence, stops: guide.spatial.stops,
      floors: plan?.floors.map(({ id, label }) => ({ id, label })),
      places: plan?.places, stopBindings: plan?.stopBindings,
    });
  }
  await mkdir('work/experience', { recursive: true });
  await writeFile('work/experience/inventory.json', JSON.stringify(guides, null, 2));
  console.log(JSON.stringify({ guides: guides.length, works: guides.reduce((n, g) => n + g.highlights.length, 0), indoor: guides.filter(g => g.floors).length }));
} finally { await vite.close(); }
