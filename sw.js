// Jornal: guarda la app en el celular para que abra sin internet.
// Si cambias index.html, sube también este archivo con un número de versión nuevo.
const VERSION = "jornal-v1";
const ARCHIVOS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Fuentes de Google: se guardan la primera vez y luego se usan sin internet.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.open(VERSION).then((c) =>
        c.match(req).then((r) => r || fetch(req).then((res) => { c.put(req, res.clone()); return res; }))
      )
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Archivos de la app: se muestra lo guardado al instante y se actualiza por detrás si hay internet.
  e.respondWith(
    caches.open(VERSION).then((c) =>
      c.match(req, { ignoreSearch: true }).then((guardado) => {
        const red = fetch(req)
          .then((res) => { if (res.ok) c.put(req, res.clone()); return res; })
          .catch(() => guardado || c.match("./index.html"));
        return guardado || red;
      })
    )
  );
});
