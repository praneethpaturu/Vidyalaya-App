// BRD §4.2 — Offline mode service worker.
// Caches the exam page + assets and queues failed /progress + /submit
// requests in IndexedDB so they auto-flush when connectivity returns.

const CACHE = "vidyalaya-exam-v2";
const STATIC_PRECACHE = ["/", "/Online_Exams"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // Best-effort precache; don't block install if any URL fails.
    await Promise.all(STATIC_PRECACHE.map((u) => c.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Drop old caches.
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Background sync: replay queued /api/offline-sync POSTs.
self.addEventListener("sync", (event) => {
  if (event.tag === "exam-sync") event.waitUntil(flushQueue());
});

// Whitelist of idempotent endpoints safe to queue + replay when offline.
// Anything that creates resources (e.g. /from-blueprint) MUST stay off
// this list to avoid duplicate creation on reconnect. /offline-sync is
// intentionally NOT here — that endpoint is for batch flushes initiated
// by the client; the per-request /progress and /submit interceptions
// give us full coverage already.
const QUEUEABLE = [
  /\/api\/online-exams\/[^/]+\/progress$/,
  /\/api\/online-exams\/[^/]+\/submit$/,
];
function isQueueable(pathname) {
  return QUEUEABLE.some((re) => re.test(pathname));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Only intercept idempotent exam POSTs for queueing.
  if (req.method === "POST" && isQueueable(url.pathname)) {
    event.respondWith(networkOrQueue(req));
    return;
  }
  // Network-first for HTML, but cache the latest response so a subsequent
  // offline reload can still serve it.
  if (req.method === "GET" && req.headers.get("accept")?.includes("text/html")) {
    event.respondWith((async () => {
      try {
        const r = await fetch(req);
        if (r.ok) {
          const clone = r.clone();
          (async () => { try { (await caches.open(CACHE)).put(req, clone); } catch {} })();
        }
        return r;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        return new Response(
          `<!doctype html><meta charset=utf-8><title>Offline</title><style>body{font-family:system-ui;padding:2rem;color:#0f172a;background:#f8fafc;text-align:center}</style>` +
          `<h1>You're offline.</h1><p>Your answers are being saved locally and will sync once you reconnect.</p>`,
          { status: 200, headers: { "content-type": "text/html" } },
        );
      }
    })());
    return;
  }

  // Static asset: cache-first then network. Helps offline reloads of CSS/JS.
  if (req.method === "GET" && (req.destination === "style" || req.destination === "script" || req.destination === "image" || req.destination === "font")) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const r = await fetch(req);
        if (r.ok) {
          const clone = r.clone();
          (async () => { try { (await caches.open(CACHE)).put(req, clone); } catch {} })();
        }
        return r;
      } catch {
        return new Response("", { status: 504 });
      }
    })());
  }
});

async function networkOrQueue(req) {
  try {
    const cloned = req.clone();
    const r = await fetch(req);
    if (!r.ok) throw new Error("not-ok");
    return r;
  } catch {
    const body = await req.clone().json().catch(() => ({}));
    await enqueue({ url: req.url, body, ts: Date.now() });
    if ("sync" in self.registration) {
      try { await self.registration.sync.register("exam-sync"); } catch {}
    }
    return new Response(JSON.stringify({ ok: true, queued: true }), {
      status: 202,
      headers: { "content-type": "application/json" },
    });
  }
}

// IndexedDB queue ----
function db() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("vidyalaya-exam", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function enqueue(item) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const tx = d.transaction("queue", "readwrite");
    tx.objectStore("queue").add(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function flushQueue() {
  const d = await db();
  const items = await new Promise((resolve, reject) => {
    const tx = d.transaction("queue", "readonly");
    const req = tx.objectStore("queue").getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  for (const it of items) {
    try {
      const r = await fetch(it.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(it.body),
      });
      if (r.ok) {
        await new Promise((resolve) => {
          const tx = d.transaction("queue", "readwrite");
          tx.objectStore("queue").delete(it.id);
          tx.oncomplete = resolve;
        });
      }
    } catch { /* keep in queue */ }
  }
}
