import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function generateGuidePrecache({ output, slugs, nestedExportDirectory = '', serviceWorkerTemplate = '' }) {
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
  for (const path of revisionFiles.sort((a,b)=>a.localeCompare(b))) hash.update(relative(output,path)).update('\0').update(await readFile(path));
  const revision = hash.digest('hex').slice(0,20);
  await writeFile(
    join(output, 'guide-precache.json'),
    `${JSON.stringify({ version: 2, revision, routes, assets: assets.sort((a, b) => a.localeCompare(b)) }, null, 2)}\n`,
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
