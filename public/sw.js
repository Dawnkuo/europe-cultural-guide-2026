const CACHE = 'europe-cultural-guide-v6';
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');
const scoped = (path) => `${BASE_PATH}${path}`;
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
].map(scoped);

async function installOfflineRoutes() {
  const cache = await caches.open(CACHE);
  const manifestUrl = scoped('/guide-precache.json');

  try {
    const response = await fetch(manifestUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Guide manifest ${response.status}`);
    const manifest = await response.clone().json();
    const guideRoutes = manifest.routes.map(scoped);
    await cache.put(manifestUrl, response);
    await cache.addAll([...CORE, ...guideRoutes]);
  } catch (error) {
    console.warn(
      'Guide route manifest unavailable; caching the core shell only.',
      error,
    );
    await cache.addAll(CORE);
  }
}

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
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
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
        async () => (await caches.match(event.request)) ?? Response.error(),
      ),
  );
});
