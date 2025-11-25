const CACHE_NAME = 'pwa-prisn3d-v4.8';
const urlsToCache = [
  '/frontend/index.html',
  '/frontend/home.html',
  '/frontend/quienes-somos.html',
  '/frontend/manifest.json',
  '/frontend/js/script.js',
  '/frontend/js/home.js',
  '/frontend/js/auth.js',
  '/frontend/css/estilos.css',

  // ICONOS CORRECTOS
  '/frontend/imagenes/logo-192.png',
  '/frontend/imagenes/logo-512.png',

  // Fallback universal
  '/frontend/imagenes/logo-192.png'
];

// Instalación
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log('Cache inicializado');

      for (const url of urlsToCache) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn('No se pudo cachear:', url, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activación
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('Eliminando cache viejo:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', event => {

  const req = event.request;

  if (!req.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req)
        .then(networkRes => {
          if (!networkRes || networkRes.status === 404) {
            if (req.destination === 'image') {
              return caches.match('/frontend/imagenes/logo-192.png');
            }
            return new Response('Recurso no disponible', { status: 503 });
          }

          return networkRes;
        })
        .catch(() => {
          if (req.destination === 'image') {
            return caches.match('/frontend/imagenes/logo-192.png');
          }

          return new Response('Offline o recurso no disponible', { status: 503 });
        });
    })
  );
});
