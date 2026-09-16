import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function generateGuidePrecache({ output, slugs, extraRoutes = /** @type {string[]} */ ([]), nestedExportDirectory = '', serviceWorkerTemplate = '' }) {
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

  for (const route of extraRoutes) {
    if (!/^\/[a-z0-9-]+\/$/.test(route)) throw new Error(`Invalid offline route: ${route}`);
    await access(join(output, route.slice(1), 'index.html'));
  }
  const routes = [...new Set(['/guides/', ...requested.map((slug) => `/guides/${slug}/`), ...extraRoutes])];
  const assets = [];
  const revisionFiles = [];
  async function collect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (directory === output && entry.name === nestedExportDirectory) continue;
        await collect(path);
      }
      else if (entry.name !== 'sw.js' && entry.name !== 'guide-precache.json') {
        if (/\.(?:js|css|woff2?|png|jpe?g|webp|svg|avif|rsc|json|webmanifest|glb)$/i.test(entry.name)) assets.push(`/${relative(output, path).split(sep).join('/')}`);
        if (/\.(?:html|js|css|woff2?|png|jpe?g|webp|svg|avif|rsc|json|webmanifest|glb)$/i.test(entry.name)) revisionFiles.push(path);
      }
    }
  }
  await collect(output);
  const hash = createHash('sha256').update(serviceWorkerTemplate ?? '');
  const integrity = {};
  for (const path of revisionFiles.sort((a,b)=>a.localeCompare(b))) {
    const bytes = await readFile(path);
    const url = `/${relative(output, path).split(sep).join('/')}`;
    hash.update(relative(output,path)).update('\0').update(bytes);
    integrity[url.endsWith('/index.html') ? url.slice(0, -10) : url] = createHash('sha256').update(bytes).digest('hex');
  }
  const revision = hash.digest('hex').slice(0,20);
  await writeFile(
    join(output, 'guide-precache.json'),
    `${JSON.stringify({ version: 2, revision, routes, assets: assets.sort((a, b) => a.localeCompare(b)), integrity }, null, 2)}\n`,
  );
  if (serviceWorkerTemplate) {
    const pattern = /const CACHE = '(europe-cultural-guide-v\d+)';/;
    if (!pattern.test(serviceWorkerTemplate)) throw new Error('Missing service-worker cache version marker');
    await writeFile(join(output,'sw.js'),serviceWorkerTemplate.replace(pattern, `const CACHE = '$1-${revision}';`));
  }
  return routes;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const output = join(process.cwd(), 'dist', 'client');
  const routes = await generateGuidePrecache({ output });
  console.log(`Prepared ${routes.length} offline guide routes.`);
}
