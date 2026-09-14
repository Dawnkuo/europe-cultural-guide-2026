import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';

// Select full compositions from the museum's gallery, not its cropped thumbnails.
const pages = [
  {
    url: 'https://www.stpetersbasilica.info/Interior/Portico/Portico.htm',
    mediaPage: 'https://commons.wikimedia.org/wiki/File:20190811_roma_jpeg2_12.jpg',
    photos: [{ id: 'peter-narthex-overall', fullFile: true, subject: 'Maderno narthex, view along the transverse hall with openings, vault and visitors', credit: 'Sean Da Ros', license: 'CC0 1.0' }],
  },
  {
    url: 'https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/museo-gregoriano-egizio/sala-iv--l_egitto-e-roma/statua-del-dio-anubi.html',
    photos: [
      { id: 'vatican-anubis-complete', filename: '04_03_statua_anubi.jpg', subject: 'Anubis statue, whole figure' },
      { id: 'vatican-anubis-head', filename: '04_03_statua_anubi_particolare.jpg', subject: 'Anubis statue, jackal head and solar disc detail' },
    ],
  },
  {
    url: 'https://accademiasanluca.it/collezioni/opere/testa-di-clemente-xiii',
    mediaPage: "https://commons.wikimedia.org/wiki/File:St._Peter's_Basilica,_Monument_to_Pope_Clement_XIII,_by_Antonio_Canova,_1792_(48466617492).jpg",
    photos: [{ id: 'peter-clement-complete', fullFile: true, subject: 'Canova monument to Clement XIII, overall view', credit: 'Gary Todd', license: 'Public Domain Mark applied by photographer; Flickr review recorded on Commons' }],
  },
  {
    url: 'https://www.stpetersbasilica.info/Monuments/GregoryXIII/GregoryXIII.htm',
    mediaPage: 'https://commons.wikimedia.org/wiki/File:Camillo_rusconi,_monumento_a_gregorio_XIII,_1723,_01.JPG',
    photos: [{ id: 'peter-gregory-complete', fullFile: true, subject: 'Rusconi monument to Gregory XIII, overall view', credit: 'Sailko', license: 'CC BY-SA 3.0' }],
  },
  {
    url: 'https://www.iubilaeum2025.va/it/pellegrinaggio/porta-santa-san-pietro.html',
    mediaPage: 'https://commons.wikimedia.org/wiki/File:Rom,_Vatikan,_Petersdom_-_Heilige_Pforte_3.jpg',
    photos: [{ id: 'peter-holy-door-complete', fullFile: true, subject: 'Vico Consorti Holy Door, closed panels', credit: 'Dnalor 01', license: 'CC BY-SA 3.0' }],
  },
  {
    url: 'https://www.stpetersbasilica.info/Interior/Portico/Portico.htm',
    mediaPage: 'https://commons.wikimedia.org/wiki/File:Vatican_City,_December_2023_IMG_6775_(54185195369).jpg',
    photos: [{ id: 'peter-narthex-vault', fullFile: true, subject: 'Maderno narthex, vault detail with Paul V arms; not the whole portico', credit: 'Brian Jeffery Beggerly', license: 'CC BY 2.0' }],
  },
  {
    url: 'https://www.stpetersbasilica.info/Monuments/AlexanderVII/AlexanderVII.htm',
    mediaPage: 'https://commons.wikimedia.org/wiki/File:Gian_Lorenzo_Bernini,_monumento_a_papa_Alessandro_VII,_1672-78_01.JPG',
    photos: [{ id: 'peter-alexander-complete', fullFile: true, subject: 'Alexander VII monument including the real doorway', credit: 'Sailko', license: 'CC BY-SA 3.0' }],
  },
  {
    url: 'https://www.stpetersbasilica.info/Monuments/AlexanderVII/AlexanderVII.htm',
    mediaPage: 'https://commons.wikimedia.org/wiki/File:Gian_Lorenzo_Bernini,_monumento_a_papa_Alessandro_VII,_1672-78_05_morte_con_clessidra.JPG',
    photos: [{ id: 'peter-alexander-death', fullFile: true, subject: 'Alexander VII monument, death and hourglass detail', credit: 'Sailko', license: 'CC BY-SA 3.0' }],
  },
  {
    url: 'https://www.basilicasanpietro.va/it/san-pietro/la-cupola',
    photos: [{ id: 'peter-dome-interior', originalUrl: 'https://www.basilicasanpietro.va/uploads/07_La_cupola_hi_5d1bdcba74.jpg', subject: 'St Peter dome drum and lower mosaic bands; source photograph excludes the lantern' }],
  },
  {
    url: 'https://www.basilicasanpietro.va/it/san-pietro/la-cattedra-di-san-pietro',
    mediaPage: 'https://commons.wikimedia.org/wiki/File:Rom,_Vatikan,_Petersdom,_Cathedra_Petri_(Bernini)_4.jpg',
    photos: [{ id: 'peter-chair-complete', fullFile: true, subject: 'Cathedra Petri monument, chair, fathers and upper glory', credit: 'Dnalor 01', license: 'CC BY-SA 3.0' }],
  },
  {
    url: 'https://www.basilicasanpietro.va/it/san-pietro/la-cupola',
    mediaPage: 'https://commons.wikimedia.org/wiki/File:St_Peter_Basilica_Dome.jpg',
    photos: [{ id: 'peter-dome-overhead', fullFile: true, subject: 'St Peter dome lantern detail; not the whole dome', credit: 'ZohaStel', license: 'CC BY-SA 3.0' }],
  },
  {
    url: 'https://www.basilicasanpietro.va/it/san-pietro/la-cupola',
    mediaPage: 'https://commons.wikimedia.org/wiki/File:0_Coupole_-_Basilique_St-Pierre_-_Vatican_(1).JPG',
    photos: [{ id: 'peter-dome-complete', fullFile: true, subject: 'St Peter dome interior looking upward', credit: 'Jean-Pol GRANDMONT', license: 'CC BY-SA 3.0' }],
  },
  {
    url: 'https://press.vatican.va/content/salastampa/it/bollettino/pubblico/2024/01/11/0030/00058.html',
    mediaPage: 'https://commons.wikimedia.org/wiki/File:Baldaquin_Bernin_Saint-Pierre_Vatican.jpg',
    photos: [{ id: 'peter-baldachin-complete', fullFile: true, subject: 'Bernini baldachin with twisted columns and upper canopy', credit: 'Jebulon', license: 'CC0' }],
  },
  {
    url: 'https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/appartamento-borgia/appartamento-borgia.html',
    mediaPage: "https://commons.wikimedia.org/wiki/File:Pinturicchio_-_St_Catherine's_Disputation_-_WGA17820.jpg",
    photos: [{ id: 'vatican-borgia-catherine', fullFile: true, subject: 'Borgia Apartment, St Catherine disputation, complete lunette', credit: 'Pinturicchio / Web Gallery of Art', license: 'Public domain, PD-Art' }],
  },
  {
    url: 'https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/museo-gregoriano-egizio/sala-ii--costumi-funerari-dellantico-egitto/telo-della-_dama-del-vaticano-.html',
    photos: [{ id: 'vatican-lady-shroud', filename: '02_05a_dama_vaticano.jpg', subject: 'Shroud of the Lady of the Vatican, cat.17953, not the mummy itself' }],
  },
  {
    url: 'https://www.basilicasanpietro.va/en/products/the-necropolis',
    photos: [{ id: 'peter-necropolis', selector: 'img[alt="necropoli-dettaglio BIG"]', subject: 'Vatican Necropolis, excavated funerary architecture below St Peter basilica' }],
  },
  {
    url: 'https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/museo-pio-clementino/Galleria-dei-Candelabri/galleria-dei-candelabri.html',
    mediaPage: 'https://commons.wikimedia.org/wiki/File:Galleria_dei_Candelabri_del_Museo_Pio_Clementino,_sez._1_-FG1.jpg',
    photos: [{ id: 'vatican-candelabra-gallery', fullFile: true, subject: 'Gallery of the Candelabra, not Braccio Nuovo', credit: 'Fabrizio Garrisi', license: 'CC BY-SA 4.0' }],
  },
  {
    url: 'https://www.osservatoreromano.va/it/news/2025-06/quo-143/nella-sfera-dell-arte.html',
    photos: [{ id: 'vatican-sphere', selector: 'meta[property="og:image"]', subject: 'Pomodoro sphere in Vatican courtyard, photograph accompanying Barbara Jatta article' }],
  },
  {
    url: 'https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/museo-pio-clementino/sala-rotonda/eracle.html',
    photos: [{ id: 'vatican-hercules-complete', filename: '07_02_ercole.jpg', subject: 'Gilded bronze Hercules Mastai, complete sculpture' }],
  },
  {
    url: 'https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/museo-pio-cristiano/sarcofagi-_a-doppio-registro/sarcofago-_dogmatico.html',
    photos: [{ id: 'vatican-dogmatic-front', filename: '05_01_Sarcofago_dogmatico.jpg', subject: 'Dogmatic sarcophagus, two-register front' }],
  },
  {
    url: 'https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/museo-gregoriano-egizio/sala-ii--costumi-funerari-dellantico-egitto/sarcofago-di-djedmut.html',
    photos: [
      { id: 'vatican-djedmut-lid', filename: '02_01a_sarcofago_Djedmut_coperchio.jpg', subject: 'Djedmut outer coffin, complete painted lid, cat.25008' },
      { id: 'vatican-djedmut-case', filename: '02_01b_sarcofago_Djedmut_cassa.jpg', subject: 'Djedmut outer coffin, painted case, cat.25008' },
    ],
  },
  {
    url: 'https://quod.lib.umich.edu/u/ummu/x-08-00355/08_00355',
    mediaPage: 'https://commons.wikimedia.org/wiki/File:Vatican_Museums_Spiral_Staircase_Looking_Up_2012.jpg',
    photos: [{ id: 'vatican-momo-up', fullFile: true, subject: 'Giuseppe Momo staircase1932, upward view', credit: 'Colin / Wikimedia Commons', license: 'https://creativecommons.org/licenses/by-sa/3.0/' }],
  },
  {
    url: 'https://quod.lib.umich.edu/u/ummu/x-08-00355/08_00355',
    mediaPage: 'https://commons.wikimedia.org/wiki/File:Vatican_Museums_Spiral_Staircase_2012.jpg',
    photos: [{ id: 'vatican-momo-down', fullFile: true, subject: 'Giuseppe Momo staircase1932, downward view with visible steps', credit: 'Colin / Wikimedia Commons', license: 'https://creativecommons.org/licenses/by-sa/3.0/' }],
  },
  {
    url: 'https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/la-pinacoteca/sala-iii---secolo-xv/beato-angelico--la-madonna-col-bambino-fra-s--domenico-e-s--cate.html',
    photos: [{ id: 'vatican-angelico-madonna-complete', filename: '03_02_beato_angelico.jpg', subject: 'Fra Angelico, Madonna with Child between Dominic and Catherine of Alexandria' }],
  },
  {
    url: 'https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/braccio-nuovo/Nilo.html',
    photos: [{ id: 'vatican-nile-complete', filename: '00_02_nilo.jpg', subject: 'Nile river god, full sculpture and base' }],
  },
  {
    url: 'https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/la-pinacoteca/sala-ii---secolo-xiii-xv/giotto-di-bondone-e-aiuti--trittico-stefaneschi.html',
    photos: [
      { id: 'vatican-stefaneschi-peter', filename: '02_02_trittico_stefaneschi_anteriore.jpg', subject: 'Stefaneschi triptych, St Peter face' },
      { id: 'vatican-stefaneschi-christ', filename: '02_02_trittico_stefaneschi_posteriore.jpg', subject: 'Stefaneschi triptych, Christ face' },
    ],
  },
  {
    url: 'https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/cappella-sistina/volta/storie-centrali/diluvio-universale.html',
    mediaPage: 'https://commons.wikimedia.org/wiki/File:Deluge,_Michelangelo.png',
    photos: [{ id: 'vatican-deluge-complete', fullFile: true, subject: 'Sistine ceiling, Deluge complete composition', credit: 'Michelangelo; digitization uploaded by Nakinn', license: 'Public domain; PD-Art (PD-old-auto-expired)' }],
  },
  {
    url: 'https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/cappella-sistina/volta/sibille-e-profeti/sibilla-libica.html',
    mediaPage: "https://commons.wikimedia.org/wiki/File:'LibyanSibyl_Sistine_Chapel_ceiling'_by_Michelangelo_JBU34.jpg",
    photos: [{ id: 'vatican-libyan-sibyl-complete', fullFile: true, subject: 'Sistine ceiling, Libyan Sibyl complete composition', credit: 'Jorg Bittner Unna', license: 'https://creativecommons.org/licenses/by/3.0/' }],
  },
];

await mkdir('public/images/details', { recursive: true });
await mkdir('sources/collections/galleries', { recursive: true });
const requested = new Set(process.argv.slice(2));
for (const id of requested) {
  if (!pages.some(page => page.photos.some(photo => photo.id === id))) throw new Error(`Unknown image ${id}`);
}
const manifestPath = 'sources/collections/galleries/vatican-reference-additions.json';
const dimensionsPath = 'app/data/media-dimensions.generated.json';
const dimensions = JSON.parse(await readFile(dimensionsPath, 'utf8'));
const manifest = await readFile(manifestPath, 'utf8').then(JSON.parse).catch(error => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
for (const page of pages.map(page => ({ ...page, photos: page.photos.filter(photo => !requested.size || requested.has(photo.id)) })).filter(page => page.photos.length)) {
  const response = await fetch(page.mediaPage ?? page.url, { headers: { 'Accept-Encoding': 'identity' }, signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`Catalog HTTP ${response.status}: ${page.url}`);
  const document = new JSDOM(await response.text()).window.document;
  const candidates = [
    ...[...document.querySelectorAll('a[itemprop="contentUrl"][data-fullscreen]')].map(element => element.getAttribute('data-fullscreen')),
    ...[...document.querySelectorAll('img[itemprop="contentUrl"]')].map(element => element.getAttribute('src')),
  ].filter(Boolean);
  for (const photo of page.photos) {
    if (photo.originalUrl && !document.documentElement.outerHTML.includes(photo.originalUrl)) throw new Error(`${photo.id}: original URL not present in source page`);
    const selected = photo.originalUrl ? [photo.originalUrl] : photo.selector
      ? [...new Set([...document.querySelectorAll(photo.selector)].map(element => element.getAttribute('src') ?? element.getAttribute('content')).filter(Boolean))]
      : photo.fullFile
      ? [...new Set([...document.querySelectorAll('.fullImageLink a')].map(anchor => anchor.getAttribute('href')).filter(Boolean).map(value => new URL(value, page.mediaPage)).filter(url => url.hostname === 'upload.wikimedia.org' && !url.pathname.includes('/thumb/')).map(url => `${url.origin}${url.pathname}`))]
      : [...new Set(candidates.filter(url => url.includes(`/${photo.filename}/`)))];
    if (selected.length !== 1) throw new Error(`${photo.id}: expected one full composition, found ${selected.length}`);
    const originalUrl = new URL(selected[0], page.url).href;
    const image = await fetch(originalUrl, { headers: { 'Accept-Encoding': 'identity' }, signal: AbortSignal.timeout(45000) });
    if (!image.ok) throw new Error(`${photo.id}: HTTP ${image.status}`);
    const original = Buffer.from(await image.arrayBuffer());
    const metadata = await sharp(original).metadata();
    if (Math.max(metadata.width, metadata.height) < 1000) throw new Error(`${photo.id}: insufficient resolution`);
    const { data, info } = await sharp(original).rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 90 }).toBuffer({ resolveWithObject: true });
    const path = `/images/details/${photo.id}.webp`;
    await writeFile(`public${path}`, data);
    dimensions[path] = { width: info.width, height: info.height };
    const previous = manifest.findIndex(record => record.id === photo.id);
    const outputSha256 = createHash('sha256').update(data).digest('hex');
    const visualReview = previous !== -1 && manifest[previous].outputSha256 === outputSha256
      ? manifest[previous].visualReview : 'pending';
    if (previous !== -1) manifest.splice(previous, 1);
    manifest.push({ id: photo.id, path, subject: photo.subject, sourcePage: page.url, mediaPage: page.mediaPage, credit: photo.credit, license: photo.license, originalUrl, originalSha256: createHash('sha256').update(original).digest('hex'), outputSha256, width: info.width, height: info.height, bytes: data.length, transformation: 'Full composition; EXIF orientation; fit inside 1800px without enlargement; WebP quality90; no crop or watermark removal', retrievedAt: new Date().toISOString(), visualReview });
    // Preserve completed acquisitions if a later host fails or rate-limits.
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await writeFile(dimensionsPath, `${JSON.stringify(Object.fromEntries(Object.entries(dimensions).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)), null, 2)}\n`);
    console.log(photo.id, info.width, info.height, data.length);
  }
}
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(dimensionsPath, `${JSON.stringify(Object.fromEntries(Object.entries(dimensions).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)), null, 2)}\n`);
