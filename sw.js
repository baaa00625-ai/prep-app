var CACHE = "prep-v2";
var SHELL = ["./", "index.html", "manifest.webmanifest", "favicon.svg", "icons/icon-192.png", "icons/icon-512.png", "data.json"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
/* network first, so changes show up as soon as they are published; the cache is the offline fallback */
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var u = new URL(r.url);
  if (u.origin !== location.origin) return; /* never touch API calls (GitHub) */
  var key = u.origin === location.origin ? new Request(u.origin + u.pathname) : r;
  e.respondWith(fetch(r).then(function (res) {
    if (res && (res.ok || res.type === "opaque")) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(key, cp); }); }
    return res;
  }).catch(function () {
    return caches.match(key).then(function (m) { return m || (r.mode === "navigate" ? caches.match("index.html") : undefined); });
  }));
});
