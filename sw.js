// ══════════════════════════════════════════════════════
// KLAVO · Service Worker v1
// Maneja: caché offline + notificaciones push
// ══════════════════════════════════════════════════════

const CACHE = 'klavo-v1';
const ARCHIVOS = ['/'];

// Instalación — precachear shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ARCHIVOS))
  );
  self.skipWaiting();
});

// Activación — limpiar cachés viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — servir desde caché si existe
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ── Push notification recibida ────────────────────────
self.addEventListener('push', e => {
  let data = { title: 'KLAVO', body: 'Tenés una nueva notificación', url: '/' };
  try { if (e.data) data = { ...data, ...e.data.json() }; } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    '/icon-192.png',
      badge:   '/icon-192.png',
      vibrate: [200, 100, 200, 100, 200],
      tag:     data.tag || 'klavo-notif',
      renotify: true,
      data:    { url: data.url || '/' }
    })
  );
});

// ── Clic en la notificación ───────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      const c = cs.find(x => x.url.includes(self.location.origin));
      if (c) { c.focus(); c.navigate(url); }
      else clients.openWindow(url);
    })
  );
});
