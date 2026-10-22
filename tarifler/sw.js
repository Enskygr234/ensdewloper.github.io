// Uygulamayı internetsiz de açılabilir yapar.
const CACHE = "tarifler-v2";
const FILES = ["./", "index.html", "style.css", "recipes.js", "app.js", "besin.js", "dunya.js", "manifest.json", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Önce internetten dene (güncel kalsın), olmazsa önbellekten ver.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // Tarif ve çeviri API'leri her zaman internetten gelsin; önbelleğe sadece uygulamanın kendi dosyaları girer
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html")))
  );
});
