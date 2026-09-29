/* Honest Penny service worker v1.
   Strategy: stale-while-revalidate for /assets/* (images, icons) so the
   installed app shell loads fast offline. HTML pages are NEVER cached -
   coupons stay fresh and expired offers disappear on schedule. */
var CACHE = 'honestpenny-assets-v1';

self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf('/assets/') !== 0) return; /* HTML: network only */
  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(e.request).then(function (hit) {
        var network = fetch(e.request).then(function (res) {
          if (res && res.ok) cache.put(e.request, res.clone());
          return res;
        }).catch(function () { return hit; });
        return hit || network;
      });
    })
  );
});
