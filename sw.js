/* Offline shell. Bump CACHE when assets change. */
const CACHE = 'compound-v8';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './css/app.css',
  './js/app.js',
  './js/data.js',
  './js/store.js',
  './js/health.js',
  './img/ab-wheel.jpg',
  './img/bench-barbell.jpg',
  './img/cable-row-seated.jpg',
  './img/calf-seated.jpg',
  './img/calf-standing.jpg',
  './img/curl-barbell.jpg',
  './img/curl-db.jpg',
  './img/deadlift.jpg',
  './img/dips-weighted.jpg',
  './img/face-pull.jpg',
  './img/ham-curl-lying.jpg',
  './img/hanging-leg-raise.jpg',
  './img/incline-db-press.jpg',
  './img/lat-pulldown-close.jpg',
  './img/lateral-raise-db.jpg',
  './img/leg-press.jpg',
  './img/machine-crunch.jpg',
  './img/pallof-press.svg',
  './img/pullup-weighted.jpg',
  './img/rdl.jpg',
  './img/row-chest-supported-db.jpg',
  './img/shoulder-press-db.jpg',
  './img/squat-barbell.jpg',
  './img/tricep-overhead.jpg',
  './img/tricep-pushdown.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Code is network-first so a deploy actually reaches the device; images stay
   cache-first because they never change. Both fall back to cache offline.
   Cache-first on JS is what previously froze installed copies on an old build. */
const isCode = url =>
  url.origin === location.origin && /\.(?:js|css|webmanifest)$/.test(url.pathname);

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate' || isCode(url)) {
    e.respondWith(
      fetch(request)
        .then(r => {
          if (r.ok && url.origin === location.origin) {
            const copy = r.clone();
            const key = request.mode === 'navigate' ? './index.html' : request;
            caches.open(CACHE).then(c => c.put(key, copy));
          }
          return r;
        })
        .catch(() => caches.match(request.mode === 'navigate' ? './index.html' : request))
    );
    return;
  }

  e.respondWith(
    caches.match(request).then(hit => hit || fetch(request).then(r => {
      if (r.ok && url.origin === location.origin) {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(request, copy));
      }
      return r;
    }).catch(() => hit))
  );
});
