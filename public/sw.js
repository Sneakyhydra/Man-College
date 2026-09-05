const CACHE_NAME = "appointments-v3";
const APP_SHELL = [
  "/manifest.webmanifest",
  "/favicon.png",
  "/pwa-192.png",
  "/pwa-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never cache app pages, Next data, or API — always network.
  const isAppNavigation =
    event.request.mode === "navigate" ||
    url.pathname.startsWith("/book") ||
    url.pathname.startsWith("/appointments") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/onboarding") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/_next");

  if (isAppNavigation || url.pathname === "/") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        return cached || Response.error();
      }),
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    }),
  );
});
