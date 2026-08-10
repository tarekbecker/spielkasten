/**
 * Service Worker for Spielkasten PWA
 * Caches all assets for offline play
 */

const CACHE_NAME = 'spiele-becker-v54';
const CHESS_ENGINE_CACHE = 'spiele-becker-chess-engine-v18-lite';
// A relative base keeps the PWA working both at a custom-domain root and at
// GitHub Pages' project path (for example /spielkasten/).
const BASE_URL = self.registration.scope;
const assetUrl = (path) => new URL(path, BASE_URL).toString();
const INDEX_URL = assetUrl('index.html');
const STOCKFISH_PATH = new URL('vendor/stockfish-18-lite-single.', BASE_URL).pathname;
const CHESS_ENGINE_ASSETS = [
  'vendor/stockfish-18-lite-single.js',
  'vendor/stockfish-18-lite-single.wasm'
].map(assetUrl);
const ASSETS = [
  '',
  'index.html',
  'dame.html',
  'muehle.html',
  'sudoku.html',
  'schiffe.html',
  'schach.html',
  'mastermind.html',
  '2048.html',
  'minesweeper.html',
  'kaesekaestchen.html',
  'memory.html',
  'game.js?v=1.1.1',
  'app.js?v=1.2.1',
  'muehle.js?v=1.1.1',
  'muehle-app.js?v=1.4.3',
  'sudoku.js?v=1.2.1',
  'sudoku-app.js?v=1.4.1',
  'schiffe.js?v=1.5.2',
  'schiffe-app.js?v=1.5.3',
  'schach-app.js?v=1.3.3',
  'mastermind.js?v=1.1.0',
  'mastermind-app.js?v=1.1.0',
  '2048.js?v=1.0.0',
  '2048-app.js?v=1.1.0',
  'minesweeper.js?v=1.1.1',
  'minesweeper-app.js?v=1.1.0',
  'kaesekaestchen.js?v=1.0.0',
  'kaesekaestchen-app.js?v=1.1.0',
  'memory.js?v=1.0.0',
  'memory-app.js?v=1.1.0',
  'assets/memory-animals.png',
  'vendor/chess-1.4.0.js',
  'manifest.json',
  'icon.svg'
].map(assetUrl);

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Caching assets...');
        return cache.addAll(ASSETS);
      }),
      // Stockfish is deliberately separate: it is large, but now gets
      // preloaded with the rest of the collection so Chess is fully offline.
      caches.open(CHESS_ENGINE_CACHE).then(cache => cache.addAll(CHESS_ENGINE_ASSETS))
    ])
      .catch((err) => {
        console.error('Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== CHESS_ENGINE_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Stockfish is a large, versioned asset. Keep it in its own cache so ordinary
  // game UI updates never make a 7 MB engine download necessary again.
  if (new URL(event.request.url).pathname.startsWith(STOCKFISH_PATH)) {
    event.respondWith(caches.open(CHESS_ENGINE_CACHE).then(cache => cache.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    }))));
    return;
  }

  event.respondWith(
    // Prefer the network whenever it is available. Cache-first made it
    // possible for an updated page to run an older game engine.
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request)
        .then((response) => {
          if (response) return response;
          if (event.request.mode === 'navigate') return caches.match(INDEX_URL);
          return new Response('Offline - Keine Verbindung verfügbar', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          });
        }))
  );
});

// Message event - handle skip waiting
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
