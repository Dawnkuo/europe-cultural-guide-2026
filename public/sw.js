const CACHE = 'europe-cultural-guide-v9';
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');
const scoped = (path) => `${BASE_PATH}${path}`;
const READY = scoped('/offline-ready');
const CORE = [
  '/',
  '/itinerary/',
  '/cities/',
  '/bookings/',
  '/vatican-guide/',
  '/manifest.webmanifest',
  '/images/st-peters-hero.jpg',
  '/images/paris.jpg',
  '/images/milan.jpg',
  '/images/venice.jpg',
  '/images/florence.jpg',
  '/images/pisa.jpg',
  '/images/barcelona.jpg',
  '/images/cologne.jpg',
  '/map-data/manifest.json',
  '/map-data/milan.json',
  '/map-data/venice.json',
  '/map-data/florence.json',
  '/map-data/pisa.json',
  '/map-data/rome-vatican.json',
  '/map-data/barcelona.json',
  '/map-data/cologne.json',
  '/map-data/paris.json',
].map(scoped);

async function installOfflineRoutes() {
  const cache = await caches.open(CACHE);
  const manifestUrl = scoped('/guide-precache.json');

  const response = await fetch(manifestUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Guide manifest ${response.status}`);
  const manifest = await response.clone().json();
  if (manifest.version !== 2 || !Array.isArray(manifest.assets) || !Array.isArray(manifest.routes)) throw new Error('Incomplete offline manifest');
  const guideRoutes = manifest.routes.map(scoped);
  const guideAssets = manifest.assets.map(scoped);
  const resources = [...new Set([...CORE, ...guideRoutes, ...guideAssets])];
  for (let start = 0; start < resources.length; start += 16) {
    await cache.addAll(resources.slice(start, start + 16));
  }
  await cache.put(manifestUrl, response);
  await cache.put(READY, new Response(CACHE));
}

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'OFFLINE_STATUS') return;
  event.waitUntil(caches.open(CACHE).then(async (cache) => {
    event.source?.postMessage({ type: 'OFFLINE_STATUS', ready: Boolean(await cache.match(READY)), version: CACHE });
  }));
});

self.addEventListener('install', (event) => {
  event.waitUntil(installOfflineRoutes());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith('europe-cultural-guide-') && key !== CACHE).map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (
    event.request.method !== 'GET' ||
    new URL(event.request.url).origin !== self.location.origin
  )
    return;

  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(event.request, response.clone());
        }
        return response;
      })
      .catch(
        async () => {
          const cache = await caches.open(CACHE);
          const exact = await cache.match(event.request);
          if (exact) return exact;
          const url = new URL(event.request.url);
          if (url.pathname.startsWith(`${BASE_PATH}/`) && url.pathname.endsWith('.rsc')) {
            url.searchParams.delete('_rsc');
            const payload = await cache.match(url.href);
            if (payload) {
              const headers = new Headers(payload.headers);
              headers.set('Content-Type', 'text/x-component');
              return new Response(payload.body, { status: payload.status, headers });
            }
          }
          return Response.error();
        },
      ),
  );
});
