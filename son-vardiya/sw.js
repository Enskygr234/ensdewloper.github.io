// Çevrimdışı oynamak için basit önbellek
const AD = 'son-vardiya-v1';
const DOSYALAR = ['./', 'index.html', 'manifest.json', 'css/stil.css', 'js/oyun.js', 'js/harita.js', 'js/hikaye.js', 'js/ses.js', 'js/yardimci.js',
  'lib/three.module.js', 'lib/three.core.js', 'fonts/literata.woff', 'fonts/literata-italic.woff', 'fonts/bigshoulders.woff', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(AD).then(c => c.addAll(DOSYALAR)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== AD).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => { e.respondWith(fetch(e.request).then(r => { const k = r.clone(); caches.open(AD).then(c => c.put(e.request, k)); return r; }).catch(() => caches.match(e.request))); });
