import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outputDirectory = join(root, 'public/map-data');
const endpoints = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

const cityBounds = {
  milan: [45.46, 9.165, 45.476, 9.196],
  venice: [45.428, 12.324, 45.442, 12.344],
  florence: [43.759, 11.246, 43.779, 11.269],
  pisa: [43.7205, 10.3925, 43.725, 10.399],
  'rome-vatican': [41.886, 12.449, 41.918, 12.497],
  barcelona: [41.375, 2.148, 41.423, 2.197],
  cologne: [50.923, 6.954, 50.945, 6.976],
  paris: [48.849, 2.336, 48.861, 2.354],
};

const standardRoadPattern =
  '^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street|pedestrian|steps)$';
const veniceRoadPattern =
  '^(pedestrian|footway|path|steps|living_street|residential)$';

function squaredDistance(point, start, end) {
  let [x, y] = start;
  let deltaX = end[0] - x;
  let deltaY = end[1] - y;

  if (deltaX !== 0 || deltaY !== 0) {
    const projection =
      ((point[0] - x) * deltaX + (point[1] - y) * deltaY) /
      (deltaX * deltaX + deltaY * deltaY);
    if (projection > 1) {
      [x, y] = end;
    } else if (projection > 0) {
      x += deltaX * projection;
      y += deltaY * projection;
    }
  }

  deltaX = point[0] - x;
  deltaY = point[1] - y;
  return deltaX * deltaX + deltaY * deltaY;
}

function simplify(points, tolerance = 0.000012) {
  if (points.length <= 2) return points;
  const threshold = tolerance * tolerance;

  function reduce(start, end, outputPoints) {
    let farthest = threshold;
    let index = -1;
    for (let cursor = start + 1; cursor < end; cursor += 1) {
      const distance = squaredDistance(
        points[cursor],
        points[start],
        points[end],
      );
      if (distance > farthest) {
        farthest = distance;
        index = cursor;
      }
    }
    if (index === -1) return;
    if (index - start > 1) reduce(start, index, outputPoints);
    outputPoints.push(points[index]);
    if (end - index > 1) reduce(index, end, outputPoints);
  }

  const outputPoints = [points[0]];
  reduce(0, points.length - 1, outputPoints);
  outputPoints.push(points.at(-1));
  return outputPoints;
}

function layerFor(tags) {
  if (tags.waterway || tags.natural === 'water' || tags.water) return 'water';
  if (tags.railway) return 'rail';
  if (['motorway', 'trunk', 'primary', 'secondary'].includes(tags.highway)) {
    return 'majorRoad';
  }
  if (['pedestrian', 'footway', 'path', 'steps'].includes(tags.highway)) {
    return 'pedestrian';
  }
  return 'road';
}

const sleep = (milliseconds) =>
  new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

async function fetchOverpass(cityId, query) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const endpoint = endpoints[attempt % endpoints.length];
    try {
      const response = await fetch(endpoint, {
        body: new URLSearchParams({ data: query }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'EuropeCulturalGuide/1.0 (private itinerary map)',
        },
        method: 'POST',
        signal: AbortSignal.timeout(120_000),
      });
      if (response.ok) return response.json();
      if (![429, 502, 503, 504].includes(response.status)) {
        throw new Error(`${cityId}: Overpass returned ${response.status}`);
      }
    } catch (error) {
      if (attempt === 4) throw error;
    }
    await sleep(2500 * 2 ** attempt);
  }
  throw new Error(`${cityId}: Overpass remained unavailable after retries`);
}

async function fetchCity(cityId, bounds) {
  const bbox = bounds.join(',');
  const roadPattern =
    cityId === 'venice' ? veniceRoadPattern : standardRoadPattern;
  const query = `[out:json][timeout:90];(
    way["highway"~"${roadPattern}"](${bbox});
    way["waterway"](${bbox});
    way["natural"="water"](${bbox});
    way["water"](${bbox});
    way["railway"~"^(rail|tram|subway|light_rail)$"](${bbox});
  );out geom;`;
  const payload = await fetchOverpass(cityId, query);
  const layers = {
    water: [],
    rail: [],
    majorRoad: [],
    road: [],
    pedestrian: [],
  };

  for (const element of payload.elements) {
    if (!element.geometry?.length) continue;
    const points = simplify(
      element.geometry.map(({ lon, lat }) => [
        Number(lon.toFixed(6)),
        Number(lat.toFixed(6)),
      ]),
    );
    if (points.length >= 2) layers[layerFor(element.tags ?? {})].push(points);
  }

  console.log(
    `${cityId}: ${Object.entries(layers)
      .map(([layer, paths]) => `${layer}=${paths.length}`)
      .join(' ')}`,
  );
  return { bounds, layers };
}

async function persistCity(cityId, map) {
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    join(outputDirectory, `${cityId}.json`),
    `${JSON.stringify({
      generatedAt: '2026-09-04',
      source: 'OpenStreetMap contributors via Overpass API',
      map,
    })}\n`,
  );
}

const generatedCities = [];
for (const [cityId, bounds] of Object.entries(cityBounds)) {
  const output = join(outputDirectory, `${cityId}.json`);
  let map;
  if (!process.argv.includes('--refresh')) {
    try {
      map = JSON.parse(await readFile(output, 'utf8')).map;
    } catch {
      map = undefined;
    }
  }
  if (map) {
    console.log(`${cityId}: using cached data`);
  } else {
    map = await fetchCity(cityId, bounds);
    await persistCity(cityId, map);
    await sleep(1500);
  }
  generatedCities.push(cityId);
}

await writeFile(
  join(outputDirectory, 'manifest.json'),
  `${JSON.stringify({
    generatedAt: '2026-09-04',
    source: 'OpenStreetMap contributors via Overpass API',
    cities: generatedCities,
  })}\n`,
);
