// OneSignal Web Push Service Worker v16 (Supports Desktop, Android Chrome, and iOS 16.4+ Safari PWA)
try {
  importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
} catch (e) {
  console.warn('[OneSignal SW] SDK import error:', e);
}

// App Badging on Mobile (iOS & Android)
self.addEventListener('push', function (event) {
  if (typeof self.navigator !== 'undefined' && 'setAppBadge' in self.navigator) {
    self.navigator.setAppBadge().catch(() => {});
  }
});

self.addEventListener('notificationclick', function (event) {
  if (typeof self.navigator !== 'undefined' && 'clearAppBadge' in self.navigator) {
    self.navigator.clearAppBadge().catch(() => {});
  }
});

// PWA Cache Management & Offline Pass-Through
const CACHE_NAME = 'rimal-pos-cache-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // Network-first pass-through for real-time POS data
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
