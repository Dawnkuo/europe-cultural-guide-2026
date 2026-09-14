import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { JSDOM } from 'jsdom';

const archive = 'work/experience/uffizi-sources';
await mkdir(archive, { recursive: true });
const metadata = JSON.parse(await readFile('app/data/guides/collection-metadata.generated.json', 'utf8'));
const pages = Object.fromEntries(Object.entries(metadata).filter(([id]) => id.startsWith('uffizi-') && id !== 'uffizi-medusa').map(([id, value]) => [id, value.sourceIds.find(url => url.includes('/artworks/'))]));
Object.assign(pages, {
  'uffizi-highlight-1': 'https://www.uffizi.it/en/artworks/botticelli-spring',
  'uffizi-highlight-2': 'https://www.uffizi.it/en/artworks/annunciation',
  'uffizi-highlight-3': 'https://www.uffizi.it/en/artworks/holy-family-known-as-the-doni-tondo',
  'uffizi-san-romano': 'https://www.uffizi.it/en/artworks/battle-of-san-romano',
  'uffizi-fortitude': 'https://www.uffizi.it/en/artworks/fortitude',
  'uffizi-portinari': 'https://www.uffizi.it/en/artworks/adoration-of-the-shepherds-with-angels-and-saints-recto-annunciation-verso',
  'uffizi-durer-magi': 'https://www.uffizi.it/en/artworks/adoration-of-the-magi-durer',
  'uffizi-eleonora': 'https://www.uffizi.it/en/artworks/eleonora-di-toledo',
  'uffizi-musical-angel': 'https://www.uffizi.it/opere/angelo-musicante',
  'uffizi-niobe': 'https://www.uffizi.it/en/artworks/niobe-with-her-younger-daughter',
  'uffizi-wrestlers': 'https://www.uffizi.it/en/artworks/wrestlers',
  'uffizi-medici-venus': 'https://www.uffizi.it/en/artworks/medici-venus',
  'uffizi-raphael-self': 'https://www.uffizi.it/en/artworks/raphael-self-portrait',
  'uffizi-three-trees': 'https://www.uffizi.it/opere/i-tre-alberi',
});
function content(node) {
  if (!node) return '';
  if (node.type === 'span') return node.value;
  return (node.children ?? []).map(content).join(node.type === 'root' ? '\n\n' : '');
}
const requested = new Set(process.argv.slice(2));
for (const [id, url] of Object.entries(pages)) {
  if (requested.size && !requested.has(id)) continue;
  if (!url) throw new Error(`Missing catalog URL: ${id}`);
  const path = `${archive}/${id}.json`;
  try { JSON.parse(await readFile(path, 'utf8')); console.log(`${id}: cached`); continue; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const response = await fetch(url, { headers: { 'Accept-Encoding': 'identity' }, signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
  const html = await response.text();
  const dom = new JSDOM(html);
  const data = dom.window.document.querySelector('#__NEXT_DATA__');
  if (!data) throw new Error(`${id}: missing page data`);
  const page = JSON.parse(data.textContent).props.pageProps.page;
  if (page.apiKey !== 'artwork' || !page.id || !page.images.length) throw new Error(`${id}: not an identified illustrated artwork`);
  const evidence = {
    id, source: url, retrievedAt: new Date().toISOString(), sourceSha256: createHash('sha256').update(html).digest('hex'),
    catalogId: page.id, title: page.title, creator: page.author, date: page.creationDate,
    material: page.technique, dimensions: page.size, inventory: page.inventory, location: page.location,
    museum: page.artworkCollection.museum.title, collection: page.artworkCollection.title,
    description: page.blocks.map(block => content(block.content?.value?.document)).filter(Boolean).join('\n\n'),
    images: page.images.map(({ image, description }) => ({ id: image.id, url: image.url, alt: image.title, description, width: image.responsiveImage.width, height: image.responsiveImage.height })),
  };
  await writeFile(`${archive}/${id}.html`, html);
  await writeFile(path, JSON.stringify(evidence, null, 2) + '\n');
  dom.window.close();
  console.log(`${id}: ${page.inventory}; ${page.location}; ${page.images.length} images`);
}
