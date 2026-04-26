// This service worker file unregisters any previously installed service worker.
// It was added after removing gatsby-plugin-offline to clean up stale caches.
self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", () => {
  self.registration
    .unregister()
    .then(() => self.clients.matchAll())
    .then(clients => clients.forEach(client => client.navigate(client.url)))
})
