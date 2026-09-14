const CACHE = 'europe-cultural-guide-v9';
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');
const scoped = (path) => `${BASE_PATH}${path}`;
const READY = scoped('/offline-ready');
let progress = { completed: 0, total: 0, phase: 'checking' };
let downloadTask;

async function publishProgress() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const client of clients) client.postMessage({ type: 'OFFLINE_PROGRESS', version: CACHE, ...progress });
}
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
  if ([...manifest.routes, ...manifest.assets].some((path) => typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('..'))) throw new Error('Invalid offline resource path');
  const guideRoutes = manifest.routes.map(scoped);
  const guideAssets = manifest.assets.map(scoped);
  const resources = [...new Set([...CORE, ...guideRoutes, ...guideAssets])];
  progress = { completed: 0, total: resources.length, phase: 'downloading' };
  await publishProgress();
  for (let start = 0; start < resources.length; start += 16) {
    await cache.addAll(resources.slice(start, start + 16));
    progress.completed = Math.min(start + 16, resources.length);
    await publishProgress();
  }
  await cache.put(manifestUrl, response);
  progress.phase = 'ready';
  await cache.put(READY, Response.json({ version: CACHE, ...progress, savedAt: new Date().toISOString() }));
  await publishProgress();
}

function download() {
  if (!downloadTask) downloadTask = installOfflineRoutes().catch(async (error) => {
    progress.phase = 'failed';
    await publishProgress();
    throw error;
  }).finally(() => { downloadTask = undefined; });
  return downloadTask;
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'OFFLINE_RETRY') {
    event.waitUntil(download().catch(() => undefined));
    return;
  }
  if (event.data?.type !== 'OFFLINE_STATUS') return;
  event.waitUntil(caches.open(CACHE).then(async (cache) => {
    const marker = await cache.match(READY);
    const saved = marker ? await marker.clone().json().catch(() => ({})) : {};
    event.source?.postMessage({ type: 'OFFLINE_STATUS', ...saved, ...progress, ready: Boolean(marker), version: CACHE,
      completed: downloadTask ? progress.completed : saved.completed ?? 0,
      total: downloadTask ? progress.total : saved.total ?? 0 });
  }));
});

self.addEventListener('install', (event) => {
  event.waitUntil(download().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith('europe-cultural-guide-') && key !== CACHE).map((key) => caches.delete(key)),
        ),
      ).then(() => self.clients.claim()),
  );
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
          if (!url.pathname.startsWith(`${BASE_PATH}/`)) return Response.error();
          // Release bookmarks use ?v=...; it does not alter these static pages.
          // Keep application query parameters distinct instead of ignoring all search.
          url.searchParams.delete('v');
          if (event.request.mode === 'navigate' && !url.search) {
            if (url.pathname.endsWith('/index.html')) url.pathname = url.pathname.slice(0, -10);
            else if (!url.pathname.endsWith('/') && !url.pathname.split('/').pop().includes('.')) url.pathname += '/';
            const page = await cache.match(url.href);
            if (page) return page;
          }
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
