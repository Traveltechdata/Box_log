// IMPORTANT: bump this on every release. It's the only thing that forces old
// cached files (HTML/JS/CSS) out of the browser once a new version is deployed.
const CACHE_NAME = 'box-log-v6-2026-08-21';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/app.js',
  './js/storage.js',
  './js/goals.js',
  './js/motivation.js',
  './js/ui/calendar.js',
  './js/ui/chart.js',
  './js/data/movements.js',
  './js/data/templates.js',
  './js/data/warmups.js',
  './js/data/skills.js',
  './js/generator/generateWod.js',
  './js/generator/readiness.js',
  './js/generator/scaling.js',
  './js/generator/validation.js',
  './js/generator/planEngine.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// NETWORK-FIRST for same-origin app files: always try to fetch the latest
// version first. Cache is only used as an offline fallback, never preferred
// over the network — otherwise updates deployed to GitHub Pages would never
// reach a device that has already loaded the app once.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
  } else {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
  }
});
