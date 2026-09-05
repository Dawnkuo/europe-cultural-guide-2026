import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const previousMetadata = JSON.parse(
  await readFile(
    'app/data/guides/collection-metadata.generated.json',
    'utf8',
  ).catch(() => '{}'),
);
const previousImages = JSON.parse(
  await readFile('sources/collections/installed.json', 'utf8').catch(
    () => '[]',
  ),
);
const groups = [
  'tuscany',
  'italy',
  'barcelona',
  'churches',
  'vatican',
  'rome-extra',
];
const aliases = {
  'doges-golden-stair': 'ducale-scala-doro',
  'doges-collegio': 'ducale-collegio-justice-peace',
  'doges-senate': 'ducale-senato-triumph-venice',
  'doges-apotheosis': 'ducale-apotheosis-venice',
  'doges-porta-carta': 'ducale-porta-della-carta',
  'doges-lion-mouth': 'ducale-bocca-di-leone',
  'venice-san-giobbe': 'accademia-san-giobbe-altarpiece',
  'venice-saint-george': 'accademia-saint-george',
  'venice-carpaccio-presentation': 'accademia-carpaccio-presentation-jesus',
  'venice-titian-pieta': 'accademia-titian-pieta',
  'venice-miracle-slave': 'accademia-miracle-slave',
  'venice-la-vecchia': 'accademia-la-vecchia',
  'venice-vitruvian': 'accademia-vitruvian-man',
  'borghese-pauline': 'borghese-pauline-bonaparte',
  'borghese-aeneas': 'borghese-aeneas-anchises-ascanius',
  'borghese-deposition': 'borghese-deposition-baglioni',
  'borghese-sacred-love': 'borghese-sacred-profane-love',
  'sforza-asse': 'sforza-sala-delle-asse',
  'sforza-trivulzio': 'sforza-trivulzio-madonna',
  'sforza-argo': 'sforza-bramantino-argo',
  'correr-daedalus': 'correr-daedalus-icarus',
  'correr-two-ladies': 'correr-two-venetian-ladies',
  'batllo-noble-hall': 'casa-batllo-noble-hall',
  'batllo-fireplace': 'casa-batllo-mushroom-fireplace',
  'batllo-rear-courtyard': 'casa-batllo-private-rear-courtyard',
  'batllo-main-stair': 'casa-batllo-wooden-main-staircase',
  'batllo-roof-chimneys': 'casa-batllo-dragon-roof-chimneys',
  'pedrera-courtyard': 'la-pedrera-entrance-murals',
  'pedrera-gate': 'la-pedrera-wrought-iron-entrance-gate',
  'pedrera-apartment': 'la-pedrera-period-apartment-dining-room',
  'pedrera-roof-exits': 'la-pedrera-roof-stairwell-exits',
  'sagrada-nativity': 'sagrada-familia-nativity-sculpture',
  'sagrada-altar': 'sagrada-familia-central-altar-baldachin',
  'sagrada-apse': 'sagrada-familia-apse-interior',
  'sagrada-glory-doors': 'sagrada-familia-glory-bronze-doors-installed',
  'sagrada-model': 'sagrada-familia-museum-hanging-model',
  'guell-austria': 'park-guell-austria-gardens',
  'guell-laundry': 'park-guell-laundry-portico',
  'guell-viaduct': 'park-guell-low-viaduct-colonnade',
  'guell-calvary': 'park-guell-calvary-three-crosses',
  'palau-song': 'palau-musica-catalan-song-sculpture',
  'palau-mosaic': 'palau-musica-upper-facade-mosaics',
  'palau-petit': 'palau-musica-petit-palau',
  'picasso-margot': 'picasso-waiting-margot-1901',
  'picasso-doves': 'picasso-doves-1957',
  'picasso-infanta': 'picasso-infanta-margarita-1957',
  'picasso-rooftops': 'picasso-barcelona-rooftops-1903',
  'picasso-sabartes': 'picasso-jaume-sabartes-1939',
  'picasso-father': 'picasso-artists-father-1896',
  'vatican-apollo': 'apollo-belvedere',
  'vatican-apoxyomenos': 'apoxyomenos-vatican',
  'vatican-augustus': 'augustus-prima-porta',
  'vatican-round-basin': 'round-hall-porphyry-basin',
  'vatican-braccio': 'braccio-nuovo-overview',
  'vatican-caravaggio': 'caravaggio-entombment',
  'vatican-foligno': 'raphael-madonna-foligno',
  'vatican-jerome': 'leonardo-saint-jerome',
  'vatican-melozzo': 'melozzo-angel-lute',
  'vatican-disputation': 'raphael-disputation',
  'vatican-fire-borgo': 'raphael-fire-borgo',
  'vatican-keys': 'perugino-delivery-keys',
  'vatican-temptations': 'botticelli-temptations-christ',
  'vatican-last-supper': 'rosselli-last-supper',
  'vatican-tapestry': 'tapestry-gallery-vatican',
  'vatican-pigna': 'pinecone-courtyard-pigna',
  'vatican-anubis': 'gregorian-egyptian-anubis',
  'vatican-todi': 'etruscan-mars-of-todi',
  'vatican-fibula': 'regolini-galassi-golden-fibula',
  'peter-bronze': 'st-peter-bronze-seated',
  'peter-longinus': 'bernini-saint-longinus',
  'peter-alexander': 'bernini-tomb-alexander-vii',
  'peter-clement': 'canova-tomb-clement-xiii',
  'peter-gregory': 'rusconi-tomb-gregory-xiii',
  'peter-filarete': 'filarete-bronze-door',
  'peter-holy-door': 'holy-door-consorti',
  'peter-narthex': 'maderno-narthex',
};
const renamed = new Map(Object.entries(aliases).map(([id, key]) => [key, id]));
await mkdir('sources/collections/manifests', { recursive: true });
await mkdir('public/images/collection', { recursive: true });
const metadata = {};
const provenance = [];
for (const group of groups) {
  const raw = await readFile(
    `/tmp/europe-expansion-${group}/manifest.json`,
    'utf8',
  );
  await writeFile(`sources/collections/manifests/${group}.json`, raw);
  const input = JSON.parse(raw);
  if (group === 'rome-extra') {
    const replacementRaw = await readFile(
      '/tmp/europe-expansion-rome-extra/replacements/manifest.json',
      'utf8',
    );
    await writeFile(
      'sources/collections/manifests/rome-replacements.json',
      replacementRaw,
    );
    const replacements = new Map(
      JSON.parse(replacementRaw).assets.map((entry) => [entry.key, entry]),
    );
    input.assets = input.assets.map(
      (entry) => replacements.get(entry.key) ?? entry,
    );
  }
  const entries =
    input.items ??
    input.assets ??
    Object.entries(input).map(([key, value]) => ({ key, ...value }));
  entries.push(
    ...(input.missing ?? []).filter(
      (entry) => previousMetadata[renamed.get(entry.key) ?? entry.key],
    ),
  );
  for (const entry of entries) {
    const id = renamed.get(entry.key) ?? entry.key;
    if (metadata[id]) throw new Error(`Duplicate collection id: ${id}`);
    const facts = (
      Array.isArray(entry.factSource) ? entry.factSource : [entry.factSource]
    ).map((source) => (typeof source === 'string' ? source : source.url));
    if (!facts.length || facts.some((url) => !/^https?:\/\//.test(url)))
      throw new Error(`Missing fact source: ${id}`);
    const record = {
      originalTitle: entry.title,
      creator: entry.artist ?? undefined,
      period: entry.date ?? undefined,
      location: entry.location ?? entry.documentedLocation ?? undefined,
      building: entry.building ?? undefined,
      sourceIds: facts,
    };
    if (entry.file && entry.imageColor !== 'black-and-white') {
      const temporary = join(root, 'public/images/collection', `${id}.jpg`);
      const size = JSON.parse(
        execFileSync(
          'work/map-venv/bin/python',
          ['scripts/optimize-collection-image.py', entry.file, temporary],
          { encoding: 'utf8' },
        ),
      );
      if (Math.max(size.width, size.height) < 800)
        throw new Error(`Undersized asset: ${id}`);
      const bytes = await readFile(temporary);
      const hash = createHash('sha256').update(bytes).digest('hex');
      record.image = `/images/collection/${id}-${hash.slice(0, 10)}.jpg`;
      await rename(temporary, join(root, 'public', record.image));
      provenance.push({
        id,
        group,
        original: entry.key,
        image: record.image,
        sha256: hash,
        bytes: bytes.length,
        ...size,
        transform:
          'Uncropped proportional resize to <=1800px; JPEG 93; no enlargement or retouching',
      });
    } else {
      record.missingImage = true;
    }
    metadata[id] = record;
  }
}
await writeFile(
  'app/data/guides/collection-metadata.generated.json',
  `${JSON.stringify(metadata, null, 2)}\n`,
);
await writeFile(
  'sources/collections/installed.json',
  `${JSON.stringify(provenance, null, 2)}\n`,
);
for (const old of previousImages) {
  if (
    !provenance.some((entry) => entry.image === old.image) &&
    old.image.startsWith('/images/collection/')
  ) {
    await rm(join(root, 'public', old.image), { force: true });
  }
}
console.log(
  `Installed ${provenance.length} images (${(provenance.reduce((sum, x) => sum + x.bytes, 0) / 1e6).toFixed(1)} MB); ${Object.keys(metadata).length} factual records.`,
);
