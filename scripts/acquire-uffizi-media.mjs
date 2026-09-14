import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { JSDOM } from 'jsdom';

const selected = {
  'uffizi-san-romano': [0], 'uffizi-fortitude': [0], 'uffizi-portinari': [0, 1, 2],
  'uffizi-durer-magi': [0], 'uffizi-eleonora': [0], 'uffizi-musical-angel': [0],
  'uffizi-niobe': [0], 'uffizi-wrestlers': [0], 'uffizi-medici-venus': [0],
  'uffizi-raphael-self': [0], 'uffizi-three-trees': [0],
  'uffizi-urbino-diptych': [0, 1, 2],
  'uffizi-leonardo-magi': [0],
};
const photoOverrides = {
  'uffizi-wrestlers': {
    page: 'https://www.uffizi.it/en/online-exhibitions/niobids-in-the-mirror',
    imageId: '65179421',
    url: 'https://www.datocms-assets.com/103094/1689241766-03-lottatori.jpg',
  },
  'uffizi-leonardo-magi': {
    page: 'https://www.uffizi.it/news/il-restauro-dell-adorazione-dei-magi-di-leonardo-da-vinci-capire-il-non-finito',
    url: 'https://www.datocms-assets.com/103094/1689170092-1507022701359340-18_dipinto-dopo-restauro.jpg',
  },
};
const manifestPath = 'sources/collections/galleries/uffizi-additions.json';
const dimensionsPath = 'app/data/media-dimensions.generated.json';
const manifest = await readFile(manifestPath, 'utf8').then(JSON.parse).catch(error => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
const dimensions = JSON.parse(await readFile(dimensionsPath, 'utf8'));
await mkdir('public/images/details', { recursive: true });
for (const [workId, indices] of Object.entries(selected)) {
  const catalog = JSON.parse(await readFile(`work/experience/uffizi-sources/${workId}.json`, 'utf8'));
  for (const index of indices) {
    const sourceImage = catalog.images[index];
    if (!sourceImage) throw new Error(`${workId}: missing gallery image ${index}`);
    const id = `${workId}-catalog-${index + 1}`;
    const path = `/images/details/${id}.webp`;
    const override = photoOverrides[workId];
    const mediaPage = override?.page;
    let originalUrl = sourceImage.url;
    let mediaPageSha256;
    if (mediaPage) {
      const page = await fetch(mediaPage, { headers: { 'Accept-Encoding': 'identity' }, signal: AbortSignal.timeout(45000) });
      if (!page.ok) throw new Error(`${workId}: photo record HTTP ${page.status}`);
      const html = await page.text();
      const document = new JSDOM(html).window.document;
      const data = JSON.parse(document.querySelector('#__NEXT_DATA__').textContent);
      const candidates = new Set();
      function visit(value) {
        if (!value || typeof value !== 'object') return;
        if (typeof value.url === 'string' && value.url.split('?')[0] === override.url && (!override.imageId || value.id === override.imageId)) candidates.add(override.url);
        for (const child of Object.values(value)) visit(child);
      }
      visit(data.props.pageProps);
      if (candidates.size !== 1) throw new Error(`${workId}: expected one identified exhibition photograph`);
      originalUrl = [...candidates][0];
      mediaPageSha256 = createHash('sha256').update(html).digest('hex');
    }
    const url = new URL(originalUrl);
    url.search = '';
    const existing = manifest.find(item => item.id === id && item.originalUrl === url.href);
    if (existing && await readFile(`public${path}`).then(data => createHash('sha256').update(data).digest('hex') === existing.outputSha256).catch(() => false)) continue;
    const response = await fetch(url, { headers: { 'Accept-Encoding': 'identity' }, signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
    const source = Buffer.from(await response.arrayBuffer());
    const original = await sharp(source).metadata();
    if (Math.max(original.width, original.height) < 1000) throw new Error(`${id}: source is too small`);
    const { data, info } = await sharp(source).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 91 }).toBuffer({ resolveWithObject: true });
    await writeFile(`public${path}`, data);
    dimensions[path] = { width: info.width, height: info.height };
    const old = manifest.findIndex(item => item.id === id);
    if (old !== -1) manifest.splice(old, 1);
    manifest.push({ id, workId, catalogId: catalog.catalogId, inventory: catalog.inventory, sourcePage: catalog.source, sourceSha256: catalog.sourceSha256, mediaPage, mediaPageSha256, sourceImageId: override ? override.imageId : sourceImage.id, ...(!mediaPage ? { sourceGalleryIndex: index } : {}), originalUrl: url.href, path, originalSha256: createHash('sha256').update(source).digest('hex'), outputSha256: createHash('sha256').update(data).digest('hex'), width: info.width, height: info.height, bytes: data.length, transformation: 'Uncropped source image; EXIF orientation; fit inside 2000px without enlargement; WebP quality91', retrievedAt: new Date().toISOString(), visualReview: 'pending' });
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await writeFile(dimensionsPath, `${JSON.stringify(Object.fromEntries(Object.entries(dimensions).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`);
    console.log(`${id}: ${info.width}x${info.height}, ${data.length} bytes`);
  }
}
