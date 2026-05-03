const CACHE_NAME = "compteur-flemmard-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isPage = event.request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");
  if (isPage) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
        .then(response => response.text())
        .then(html => {
          const fixed = html.replace(
            "input.oninput=()=>{state.players[i]=input.value.trim()||`Joueur ${i+1}`;render()}",
            "input.oninput=()=>{state.players[i]=input.value.trim()||`Joueur ${i+1}`;renderSelectors();renderRoundScores();renderStatus();renderTotals();renderRecap();renderHistory();save()}"
          );
          return new Response(fixed, {
            headers: { "Content-Type": "text/html; charset=utf-8" }
          });
        })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
