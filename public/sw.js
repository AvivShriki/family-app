// רכיב הרקע של האפליקציה המותקנת.
//
// שתי אסטרטגיות שונות בכוונה:
//   מסמך הפתיחה נטען מהרשת קודם, ורק אם אין רשת מהמטמון. כך פריסה
//   חדשה מגיעה מיד ואי אפשר להיתקע על גרסה ישנה — התקלה הנפוצה של
//   רכיבי רקע.
//   קובצי הקוד נושאים חתימה בשם הקובץ, ולכן אפשר להגיש אותם מהמטמון
//   בלי חשש: שינוי בקוד משנה את השם.
const CACHE = 'family-app-v3';
const SHELL = ['./', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // רק מה שמוגש מאותו מקור. בקשות ל-Firestore חייבות לעבור כמות שהן.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./').then((r) => r || fetch(request))),
    );
    return;
  }

  e.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
