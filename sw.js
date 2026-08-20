/* Offline shell. Bump CACHE when assets change. */
const CACHE = 'pushpull-v1';
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

/* Cache-first for assets, network-first for navigation so updates land. */
self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(r => { caches.open(CACHE).then(c => c.put('./index.html', r.clone())); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(request).then(hit => hit || fetch(request).then(r => {
      if (r.ok && new URL(request.url).origin === location.origin) {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(request, copy));
      }
      return r;
    }).catch(() => hit))
  );
});
