// Basic app-shell caching service worker
const CACHE_NAME = 'weekly-scheduler-cache-v1'
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => (k === CACHE_NAME ? undefined : caches.delete(k)))
      )
    )
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Runtime cache for same-origin GET
  if (req.method === 'GET' && url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached
        return fetch(req)
          .then((res) => {
            const resClone = res.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone))
            return res
          })
          .catch(() => caches.match('/index.html'))
      })
    )
  }
})