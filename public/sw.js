const CACHE = "europe-cultural-guide-v1";
const CORE = [
  "/",
  "/itinerary",
  "/cities",
  "/bookings",
  "/sources",
  "/manifest.webmanifest",
  "/images/st-peters-hero.jpg",
  "/images/paris.jpg",
  "/images/milan.jpg",
  "/images/venice.jpg",
  "/images/florence.jpg",
  "/images/pisa.jpg",
  "/images/barcelona.jpg",
  "/images/cologne.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    }),
  );
});
