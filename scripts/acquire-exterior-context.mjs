import fs from 'node:fs/promises';
import { createServer } from 'vite';
import { museums } from '../sources/exteriors/museums/catalog.mjs';
import { readFootprints, bounds, selectedGeometry } from '../sources/exteriors/museums/footprints.mjs';

const directory = new URL('../sources/exteriors/context/', import.meta.url);
await fs.mkdir(new URL('raw/', directory), { recursive: true });
const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
let sites;
try {
  const { guideCatalog } = await server.ssrLoadModule('/app/data/guides.ts');
  const { mapLocationForTripItem } = await server.ssrLoadModule('/app/data/trip-map-locations.ts');
  sites = guideCatalog.map(g => ({ slug: g.slug, title: g.title, kind: g.kind,
    location: g.itemIds.map(id => mapLocationForTripItem({ id })).find(Boolean) ?? null }));
} finally { await server.close(); }
await fs.writeFile(new URL('sites.json', directory), JSON.stringify(sites, null, 2) + '\n');
const filter = process.argv.slice(2);
for (const site of sites.filter(s => !filter.length || filter.includes(s.slug))) {
  if (!site.location) { console.log(`${site.slug}: no fixed location`); continue; }
  const path = new URL(`raw/${site.slug}.json`, directory);
  try { JSON.parse(await fs.readFile(path, 'utf8')); console.log(`${site.slug}: cached`); continue; } catch {}
  let radius = site.location.precision === 'area-representative' ? 400 : 280;
  const museum = museums.find(m => m.slug === site.slug);
  if (museum) {
    const source = readFootprints(site.slug);
    const box = bounds(selectedGeometry(source, museum.keys));
    radius = Math.max(radius, ...box.map(n => Math.abs(n) + 120));
  }
  if (site.slug.startsWith('st-peters')) radius = 550;
  radius = Math.min(1000, Math.ceil(radius));
  const [lon, lat] = site.location.coordinates;
  const dx = radius / (111320 * Math.cos(lat * Math.PI / 180)), dy = radius / 111320;
  const bbox = [lon - dx, lat - dy, lon + dx, lat + dy];
  const url = `https://api.openstreetmap.org/api/0.6/map.json?bbox=${bbox.join(',')}`;
  let error;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(90000), headers: { 'User-Agent': 'EuropeCulturalGuide/1.0 (local offline scenery preparation)' } });
      if (!response.ok) throw Error(`HTTP ${response.status}`);
      const data = await response.json();
      // Merge complete selected compound relations from the already verified source cache.
      const elements = new Map(data.elements.map(e => [e.type[0] + e.id, e]));
      if (museum) for (const e of readFootprints(site.slug).data.elements) if (!elements.has(e.type[0] + e.id)) elements.set(e.type[0] + e.id, e);
      await fs.writeFile(path, JSON.stringify({ slug: site.slug, location: site.location, radius, bbox,
        fetchedAt: new Date().toISOString(), source: url, elements: [...elements.values()] }));
      console.log(`${site.slug}: ${elements.size} elements, radius ${radius}m`);
      error = null;
      break;
    } catch (e) { error = e; console.warn(`${site.slug}: attempt ${attempt + 1}: ${e.message}`); await new Promise(r => setTimeout(r, 2500 * (attempt + 1))); }
  }
  if (error) console.error(`${site.slug}: FAILED ${error.message}`);
  await new Promise(r => setTimeout(r, 400));
}
