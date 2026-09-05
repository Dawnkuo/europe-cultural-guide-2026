import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { JSDOM } from 'jsdom';

const root = process.cwd();
const output = join(root, 'work/media-review');
mkdirSync(output, { recursive: true });
function walk(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? walk(join(folder, entry.name))
      : [join(folder, entry.name)],
  );
}
const usages = [];
for (const path of walk(join(root, 'dist/client')).filter(
  (p) =>
    p.endsWith('/index.html') && !p.includes('/europe-cultural-guide-2026/'),
)) {
  const dom = new JSDOM(readFileSync(path, 'utf8'));
  const document = dom.window.document;
  for (const image of document.querySelectorAll('img')) {
    const src = image
      .getAttribute('src')
      ?.replace(/^\/europe-cultural-guide-2026\//, '/');
    const article = image.closest('article');
    usages.push({
      page: relative(join(root, 'dist/client'), path),
      src,
      alt: image.getAttribute('alt'),
      heading:
        article?.querySelector('h3,h2')?.textContent ??
        document.querySelector('h1')?.textContent,
      hero: Boolean(image.closest('.guide-hero')),
      highlight: Boolean(image.closest('.guide-highlight__media')),
    });
  }
  dom.window.close();
}
writeFileSync(
  join(output, 'usage.json'),
  JSON.stringify(usages, null, 2) + '\n',
);
console.log(
  `${usages.length} image uses in ${new Set(usages.map((u) => u.page)).size} pages; ${new Set(usages.map((u) => u.src)).size} unique referenced images.`,
);
