const CACHE_NAME = "compteur-flemmard-v6";
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
          let fixed = html.replace(
            "input.oninput=()=>{state.players[i]=input.value.trim()||`Joueur ${i+1}`;render()}",
            "input.oninput=()=>{state.players[i]=input.value.trim()||`Joueur ${i+1}`;renderSelectors();renderRoundScores();renderStatus();renderTotals();renderRecap();renderHistory();save()}"
          );
          const compactToolbar = '<div class="toolbar"><button id="exportJson">Exporter</button><button id="exportCsv">CSV</button><button id="importButton">Importer</button><button id="resetGame" class="danger">Reset</button><input id="importFile" class="file" type="file" accept="application/json"></div>';
          const expandedToolbar = '<div class="toolbar">\n        <button id="exportJson" type="button">Exporter</button>\n        <button id="exportCsv" type="button">CSV</button>\n        <button id="importButton" type="button">Importer</button>\n        <button id="resetGame" class="danger" type="button">Reset</button>\n        <input id="importFile" class="file-input" type="file" accept="application/json">\n      </div>';
          const compactBackup = '<div class="group"><h2>Sauvegarde</h2><div class="buttons"><button id="exportJson">Exporter</button><button id="exportCsv">CSV</button><button id="importButton">Importer</button><button id="resetGame" class="danger">Reset</button><input id="importFile" class="file" type="file" accept="application/json"></div></div>';
          fixed = fixed.replace(compactToolbar, "").replace(expandedToolbar, "");
          if (!fixed.includes("<h2>Sauvegarde</h2>")) {
            fixed = fixed.replace(
              '<p class="hint">Le total peut être simple, comme 80, ou composé, comme -100 // -50.</p></div></div></details>',
              '<p class="hint">Le total peut être simple, comme 80, ou composé, comme -100 // -50.</p></div>' + compactBackup + '</div></details>'
            );
          }
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
