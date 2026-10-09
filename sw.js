// Chistaco offline support: the page is fetched fresh when online (so new jokes appear),
// everything else (icons, audios) is served from the cache after the first play.
const CACHE = "chistaco-v2";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.headers.has("range")) return; // let the browser stream audio normally
  if (req.mode === "navigate") {
    e.respondWith(fetch(req.url, {cache: "no-cache"}).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put("./", c)); return r; })
      .catch(() => caches.match("./")));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
    return r;
  })));
});
