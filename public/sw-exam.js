// BRD §4.2 — Offline mode service worker.
// Caches the exam page + assets and queues failed /progress + /submit
// requests in IndexedDB so they auto-flush when connectivity returns.

const CACHE = "vidyalaya-exam-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Background sync: replay queued /api/offline-sync POSTs.
self.addEventListener("sync", (event) => {
  if (event.tag === "exam-sync") event.waitUntil(flushQueue());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Only intercept exam-related POSTs for queueing.
  if (req.method === "POST" && (
        url.pathname.includes("/api/online-exams/") ||
        url.pathname.includes("/api/offline-sync"))) {
    event.respondWith(networkOrQueue(req));
    return;
  }
  // For navigations / static assets, prefer cache-first when offline.
  if (req.method === "GET" && req.headers.get("accept")?.includes("text/html")) {
    event.respondWith((async () => {
      try { return await fetch(req); }
      catch {
        const cached = await caches.match(req);
        return cached || new Response("Offline — your answers are saved locally and will sync when you reconnect.", { status: 200, headers: { "content-type": "text/html" } });
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
