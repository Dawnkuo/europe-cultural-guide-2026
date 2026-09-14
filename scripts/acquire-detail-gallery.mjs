import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const sourcePage = 'https://www.uffizi.it/en/artworks/botticelli-spring';
const records = [
  ['uffizi-spring-complete', 'https://www.datocms-assets.com/103094/1688660189-1543409158632122-botticelli-primavera-intero.jpg', 'Complete Spring'],
  ['uffizi-spring-graces', 'https://www.datocms-assets.com/103094/1688660198-1543409165944481-primavera-grazie.jpg', 'Three Graces detail'],
  ['uffizi-spring-zephyr', 'https://www.datocms-assets.com/103094/1688660204-1543409180632402-primavera-flora.jpg', 'Zephyr and Chloris detail'],
  ['uffizi-spring-mercury', 'https://www.datocms-assets.com/103094/1688660211-1543409187920849-primavera-mercurio.jpg', 'Mercury detail'],
];
await mkdir('public/images/details', { recursive: true });
await mkdir('sources/collections/galleries', { recursive: true });
const manifest = [];
for (const [id, originalUrl, subject] of records) {
  const response = await fetch(`${originalUrl}?w=1800&fit=max`, { headers: { 'Accept-Encoding': 'identity' }, signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
  const original = Buffer.from(await response.arrayBuffer());
  const metadata = await sharp(original).metadata();
  if (Math.max(metadata.width, metadata.height) < 1000) throw new Error(`${id}: inadequate source resolution`);
  const { data, info } = await sharp(original).rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 88 }).toBuffer({ resolveWithObject: true });
  const path = `/images/details/${id}.webp`;
  await writeFile(`public${path}`, data);
  manifest.push({ id, path, subject, sourcePage, originalUrl, width: info.width, height: info.height, bytes: data.length, reviewedAt: '2026-09-08' });
  console.log(id, info.width, info.height, data.length);
}
await writeFile('sources/collections/galleries/uffizi-spring.json', JSON.stringify(manifest, null, 2));
