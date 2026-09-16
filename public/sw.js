const CACHE = 'europe-cultural-guide-v9';
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');
const scoped = (path) => `${BASE_PATH}${path}`;
const READY = scoped('/offline-ready');
const CHECKPOINT = scoped('/offline-progress');
const REVISION = CACHE.match(/-([a-f0-9]{20})$/)?.[1];
const VERIFIED = 'X-Offline-Sha256';
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

async function manifestFor(cache) {
  const manifestUrl = scoped('/guide-precache.json');
  const response = await cache.match(manifestUrl) ?? await fetch(manifestUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Guide manifest ${response.status}`);
  const manifest = await response.clone().json();
  if (manifest.version !== 2 || !Array.isArray(manifest.assets) || !Array.isArray(manifest.routes) || !manifest.integrity) throw new Error('Incomplete offline manifest');
  if (REVISION && manifest.revision !== REVISION) throw new Error('Offline release changed; update the service worker');
  if ([...manifest.routes, ...manifest.assets].some((path) => typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('..'))) throw new Error('Invalid offline resource path');
  const resources = [...new Set([...CORE, ...manifest.routes.map(scoped), ...manifest.assets.map(scoped)])];
  if (resources.some(url => !/^[a-f0-9]{64}$/.test(manifest.integrity[url.slice(BASE_PATH.length)]))) throw new Error('Missing offline resource checksum');
  await cache.put(manifestUrl, response);
  return { resources, integrity: manifest.integrity };
}

async function checkpoint(cache) {
  await cache.put(CHECKPOINT, Response.json({ version: CACHE, ...progress }));
  await publishProgress();
}

async function installOfflineRoutes() {
  const cache = await caches.open(CACHE);
  const { resources, integrity } = await manifestFor(cache);
  const missing = [];
  for (const url of resources) {
    const saved = await cache.match(url);
    if (saved?.status !== 200 || saved.headers.get(VERIFIED) !== integrity[url.slice(BASE_PATH.length)]) missing.push(url);
  }
  progress = { completed: resources.length - missing.length, total: resources.length, phase: 'downloading' };
  if (missing.length) await cache.delete(READY);
  await checkpoint(cache);
  // Each verified response commits independently. A failed peer must not roll
  // back completed files; cache entries are also the resume journal after a kill.
  for (let start = 0; start < missing.length; start += 4) {
    const results = await Promise.allSettled(missing.slice(start, start + 4).map(async url => {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.status !== 200) throw new Error(`Offline resource ${response.status}: ${url}`);
      const bytes = await response.arrayBuffer();
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
      if (digest !== integrity[url.slice(BASE_PATH.length)]) throw new Error(`Offline resource checksum mismatch: ${url}`);
      const headers = new Headers(response.headers);
      // fetch() has decoded the body; copied transfer headers no longer apply.
      headers.delete('content-encoding');
      headers.delete('content-length');
      headers.set(VERIFIED, digest);
      await cache.put(url, new Response(bytes, { status: 200, headers }));
      progress.completed += 1;
    }));
    await checkpoint(cache);
    const failure = results.find(result => result.status === 'rejected');
    if (failure) throw failure.reason;
  }
  progress.phase = 'ready';
  await cache.put(READY, Response.json({ version: CACHE, ...progress, savedAt: new Date().toISOString() }));
  await cache.delete(CHECKPOINT);
  await publishProgress();
}

function download() {
  if (!downloadTask) downloadTask = installOfflineRoutes().catch(async (error) => {
    progress.phase = 'failed';
    await (await caches.open(CACHE)).put(CHECKPOINT, Response.json({ version: CACHE, ...progress })).catch(() => {});
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
    const marker = await cache.match(READY) ?? await cache.match(CHECKPOINT);
    const saved = marker ? await marker.clone().json().catch(() => ({})) : {};
    event.source?.postMessage({ type: 'OFFLINE_STATUS', ...(downloadTask ? progress : marker ? saved : progress), ready: saved.phase === 'ready', version: CACHE,
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
        if (response.status === 200) {
          const cache = await caches.open(CACHE);
          // Keep the verified offline snapshot coherent until the next release
          // activates, even while online navigation is showing newer documents.
          const saved = await cache.match(event.request);
          if (!saved?.headers.get(VERIFIED)) await cache.put(event.request, response.clone());
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
