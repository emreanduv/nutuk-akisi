// Nutuk Salonu: çevrimdışı önbellek (gözlükte internetsiz açılsın)
// Önbellek adı bulunduğu adrese göre ayrılır: deneme kopyası (/nutuk-salonu-test/) yayındaki salonun önbelleğine dokunmaz.
const ONEK = /-test\//.test(new URL(self.registration.scope).pathname) ? 'salontest-' : 'salon-';
const SURUM = ONEK + '4';
const DOSYALAR = ['./', 'index.html', 'salon.js', 'veri.json', 'yardim.js', 'manifest.webmanifest', 'simge-192.png', 'simge-512.png',
  'vendor/three.module.js', 'vendor/addons/webxr/XRControllerModelFactory.js', 'vendor/addons/loaders/GLTFLoader.js',
  'vendor/addons/libs/motion-controllers.module.js', 'vendor/addons/utils/BufferGeometryUtils.js'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(SURUM).then(c => c.addAll(DOSYALAR)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== SURUM && x.startsWith(ONEK)).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  if(e.request.method !== 'GET') return;
  const sayfa = e.request.mode === 'navigate'; // index.html?quest=1 gibi adresler de önbellekteki sayfayla açılsın
  e.respondWith(caches.match(e.request, { ignoreSearch:sayfa }).then(h => h || fetch(e.request).then(r => {
    if(r.ok && new URL(e.request.url).origin === location.origin && !sayfa){ const k = r.clone(); caches.open(SURUM).then(c => c.put(e.request, k)); }
    return r;
  }).catch(() => h)));
});
