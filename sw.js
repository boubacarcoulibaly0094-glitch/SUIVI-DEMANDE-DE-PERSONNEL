// ═══════════════════════════════════════════════
//  Service Worker — Dashboard RH PWA
//  Gère le cache et le mode hors-ligne
// ═══════════════════════════════════════════════

const CACHE_NAME = 'dashboard-rh-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap'
];

// Installation : mise en cache des ressources
self.addEventListener('install', function(event) {
  console.log('[SW] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function(err) {
        console.warn('[SW] Erreur cache partiel:', err);
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', function(event) {
  console.log('[SW] Activation...');
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch : stratégie Cache First puis réseau
self.addEventListener('fetch', function(event) {
  // Ne pas intercepter les appels vers Google Apps Script
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        // Mettre en cache les nouvelles ressources
        if (response && response.status === 200 && response.type === 'basic') {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        // Hors ligne : retourner la page principale
        return caches.match('./index.html');
      });
    })
  );
});

// Message pour mise à jour
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
