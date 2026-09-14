import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';

const root = 'https://www.galleriaaccademiafirenze.it/';
const records = {
  david: 'opere/david-michelangelo/',
  young: 'opere/schiavo-giovane-michelangelo/',
  atlas: 'opere/atlante-michelangelo/',
  awakening: 'opere/prigione-che-si-ridesta-michelangelo/',
  bearded: 'opere/prigione-barbuto-michelangelo/',
  matthew: 'opere/san-matteo-michelangelo/',
  sabines: 'opere/ratto-sabine-giambologna/',
  viola: 'opere/viola-tenore-stradivari/',
  botticelli: 'opere/madonna-con-bambino-san-giovannino-botticelli/',
  tree: 'opere/albero-della-vita-pacino-bonaguida/',
  monaco: 'opere/annunciazione-e-santi-lorenzo-monaco/',
  cassone: 'opere/cassone-adimari-lo-scheggia/',
  pontormo: 'opere/venere-e-cupido/',
  spinet: 'opere/spinetta-ovale-bartolomeo-cristofori/',
  collections: 'collezioni/',
  visit: 'visita/',
};
const directory = 'work/experience/accademia-sources';
await mkdir(directory, { recursive: true });
await mkdir('public/images/details', { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const get = url => execFileSync('curl', ['-fsSL', '--retry', '2', '--max-time', '60', url], { maxBuffer: 32 * 1024 * 1024 });
const manifestPath = 'sources/collections/galleries/accademia-additions.json';
const manifest = await readFile(manifestPath, 'utf8').then(JSON.parse).catch(error => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
const dimensionsPath = 'app/data/media-dimensions.generated.json';
const dimensions = JSON.parse(await readFile(dimensionsPath, 'utf8'));
const catalog = [];
for (const [id, path] of Object.entries(records)) {
  const url = new URL(path, root).href;
  const htmlPath = `${directory}/${id}.html`;
  const html = await readFile(htmlPath).catch(error => {
    if (error.code === 'ENOENT') return get(url);
    throw error;
  });
  const document = new JSDOM(html.toString()).window.document;
  const main = document.querySelector('main');
  if (!main) throw new Error(`${id}: expected main content`);
  const article = path.startsWith('opere/') ? main.querySelector('article') : main;
  if (!article) throw new Error(`${id}: missing article`);
  const title = main.querySelector('h1')?.textContent.trim() || document.title;
  if (!title) throw new Error(`${id}: missing title`);
  const fields = Object.fromEntries([...article.querySelectorAll('li')].flatMap(li => {
    const key = li.querySelector('strong')?.textContent.trim();
    return key ? [[key.replace(/:$/, ''), li.textContent.slice(li.textContent.indexOf(key) + key.length).replace(/^\s*:\s*/, '').trim()]] : [];
  }));
  const paragraphs = [...article.querySelectorAll('p')].map(p => p.textContent.trim()).filter(Boolean);
  const photo = main.querySelector('.hero img');
  const image = photo?.getAttribute('data-src');
  const record = { id, url, title, fields, paragraphs, image, imageAlt: photo?.getAttribute('alt'), sourceSha256: hash(html), retrievedAt: new Date().toISOString() };
  await writeFile(htmlPath, html);
  await writeFile(`${directory}/${id}.json`, `${JSON.stringify(record, null, 2)}\n`);
  catalog.push({ id, url, title, fields, sourceSha256: record.sourceSha256, retrievedAt: record.retrievedAt });
  console.log(`${id}: ${title}`);
  if (!image || ['visit', 'collections', 'viola'].includes(id)) continue;
  const outputPath = `/images/details/accademia-${id}.webp`;
  const existing = manifest.find(item => item.id === id);
  if (existing?.originalUrl === image && await readFile(`public${outputPath}`).then(data => hash(data) === existing.outputSha256).catch(() => false)) continue;
  const bytes = get(image);
  const original = await sharp(bytes).metadata();
  if (Math.max(original.width, original.height) < 1000) throw new Error(`${id}: image too small`);
  const { data, info } = await sharp(bytes).rotate().resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 92 }).toBuffer({ resolveWithObject: true });
  await writeFile(`public${outputPath}`, data);
  const recordIndex = manifest.findIndex(item => item.id === id);
  if (recordIndex >= 0) manifest.splice(recordIndex, 1);
  manifest.push({ id, sourcePage: url, sourceSha256: record.sourceSha256, inventory: fields.Inventario, originalUrl: image, originalSha256: hash(bytes), path: outputPath, outputSha256: hash(data), width: info.width, height: info.height, bytes: data.length, transformation: 'Uncropped source; EXIF orientation; fit inside 2200px without enlargement; WebP quality92', retrievedAt: record.retrievedAt, visualReview: 'pending' });
  dimensions[outputPath] = { width: info.width, height: info.height };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(dimensionsPath, `${JSON.stringify(Object.fromEntries(Object.entries(dimensions).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`);
}
await writeFile('sources/collections/accademia-catalog-review.json', `${JSON.stringify(catalog, null, 2)}\n`);
