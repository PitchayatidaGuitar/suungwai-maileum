// ── สูงวัย ไม่ลืม — Service Worker ──
const CACHE_NAME = 'suungwai-v1';
const ASSETS = [
  './',
  './index.html',
];

// ── Install: cache ไฟล์หลัก ──
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.log('Cache addAll error (ok to ignore):', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: ลบ cache เก่า ──
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: Network first, fallback to cache ──
self.addEventListener('fetch', (e) => {
  // ไม่ cache Google APIs / external requests
  if (e.request.url.includes('googleapis.com') ||
      e.request.url.includes('script.google.com') ||
      e.request.url.includes('fonts.gstatic.com') ||
      e.request.url.includes('cdn.jsdelivr.net')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // cache response ใหม่
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // offline → ดึงจาก cache
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          // fallback หน้าหลัก
          return caches.match('./index.html');
        });
      })
  );
});
