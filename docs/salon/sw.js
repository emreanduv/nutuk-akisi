// Nutuk Salonu: çevrimdışı önbellek (gözlükte internetsiz açılsın)
const SURUM = 'salon-2';
const DOSYALAR = ['./', 'index.html', 'salon.js', 'veri.json', 'manifest.webmanifest', 'simge-192.png', 'simge-512.png',
  'vendor/three.module.js', 'vendor/addons/webxr/XRControllerModelFactory.js', 'vendor/addons/loaders/GLTFLoader.js',
  'vendor/addons/libs/motion-controllers.module.js', 'vendor/addons/utils/BufferGeometryUtils.js'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(SURUM).then(c => c.addAll(DOSYALAR)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== SURUM).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  if(e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(h => h || fetch(e.request).then(r => {
    if(r.ok && new URL(e.request.url).origin === location.origin){ const k = r.clone(); caches.open(SURUM).then(c => c.put(e.request, k)); }
    return r;
  }).catch(() => h)));
});
