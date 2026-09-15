import { readdir, readFile, rm, stat } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import ts from 'typescript';

async function filesIn(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(path));
    else files.push(path);
  }
  return files;
}

// Dimensions describe files, but do not cause the browser to request them.
// Scan every other app module, including lazy galleries and fallback code.
export async function mediaReferences(appRoot) {
  const sources = [];
  const prefixes = new Set();
  for (const file of await filesIn(appRoot)) {
    if (!/\.(?:tsx?|jsx?|json|css)$/.test(file) || /\.(?:test|spec)\./.test(file) || basename(file) === 'media-dimensions.generated.json') continue;
    const text = await readFile(file, 'utf8');
    sources.push(text);
    if (file.endsWith('.css')) continue;
    const tree = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isStringLiteralLike(node) || node.kind === ts.SyntaxKind.TemplateHead) {
        // Keep an entire prefix when an asset URL may be assembled at runtime.
        if (node.text.startsWith('/') && node.text.length > 1) prefixes.add(node.text);
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
  }
  return { text: sources.join('\n'), prefixes: [...prefixes] };
}

export async function pruneProductionResources({ output, appRoot, nestedExportDirectory }) {
  const references = await mediaReferences(appRoot);
  const files = await filesIn(output);
  const removed = [];
  const retainedMedia = [];
  const routeText = (await Promise.all(files.filter(file => /\.(?:html|rsc|css|webmanifest)$/.test(file) || (file.endsWith('.js') && !file.includes('/_next/'))).map(file => readFile(file, 'utf8')))).join('\n');

  // Only superseded editorial media and unused legacy fonts are candidates.
  // Models, map data, textures, fallbacks, licenses and source records stay intact.
  for (const file of files) {
    const path = relative(output, file).replaceAll('\\', '/');
    const url = `/${path}`;
    if (!/^(?:images\/|vatican-guide\/assets\/(?:images|fonts)\/)/.test(path) || !/\.(?:png|jpe?g|webp|avif|woff2?)$/i.test(path)) continue;
    const used = references.text.includes(url) || references.text.includes(basename(file)) || references.prefixes.some(prefix => url.startsWith(prefix)) || routeText.includes(url);
    if (used) retainedMedia.push(url);
    else removed.push({ path, bytes: (await stat(file)).size, reason: 'unreferenced-media' });
  }

  // Vite emits assets under the base path; the exporter copies them to their
  // canonical GitHub Pages location. Remove only byte-identical duplicates.
  const nestedPrefix = `${nestedExportDirectory}/_next/`;
  for (const file of files) {
    const path = relative(output, file).replaceAll('\\', '/');
    if (!nestedExportDirectory || !path.startsWith(nestedPrefix)) continue;
    const canonical = join(output, '_next', path.slice(nestedPrefix.length));
    const bytes = await readFile(file);
    if (!bytes.equals(await readFile(canonical))) throw new Error(`Export duplicate differs from canonical asset: ${path}`);
    removed.push({ path, bytes: bytes.length, reason: 'duplicate-base-path-asset' });
  }

  const trialModules = files.filter(file => /(?:ExteriorModelPreview|ReferenceExterior|exterior-references|sketchfab-viewer)[^/]*\.js$/.test(file));
  if (trialModules.length || files.some(file => /\/models(?:\.html|\.rsc|\/index\.html)$/.test(file))) {
    throw new Error('Online model trial code or route is still present in the production export');
  }

  for (const item of removed) await rm(join(output, item.path));
  if (nestedExportDirectory) await rm(join(output, nestedExportDirectory, '_next'), { recursive: true, force: true });
  return { removed, retainedMedia, removedBytes: removed.reduce((total, item) => total + item.bytes, 0) };
}
