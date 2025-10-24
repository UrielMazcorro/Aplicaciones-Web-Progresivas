const CACHE_NAME = "prisn3d-cache-v1";
const urlsToCache = [
  "/assets/index.html",
  "/assets/home.html",
  "/assets/css/estilos.css",
  "/assets/css/home.css",
  "/assets/js/script.js",
  "/assets/js/home.js",
  "/assets/imagenes/logo-64.png"
];

// Instalar y guardar en caché
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
      .catch(err => console.error("Error cacheando archivos:", err))
  );
});

// Activar y limpiar cachés antiguos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
});

// Interceptar peticiones
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => caches.match("/assets/index.html")) // fallback
  );
});
