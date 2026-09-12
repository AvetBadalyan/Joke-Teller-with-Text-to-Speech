/**
 * service-worker.js - Service Worker (PWA offline support)
 *
 * Strategy: network-first for our own files.
 * We always try the network so a reload gets the latest code,
 * and fall back to the cache only when the user is offline.
 * External requests (the joke API) are left untouched.
 */

const CACHE_VERSION = 'v1.8.0'
const CACHE_NAME = `joke-teller-${CACHE_VERSION}`

const STATIC_ASSETS = [
	'./index.html',
	'./offline.html',
	'./style.css',
	'./manifest.json',
	'./js/config.js',
	'./js/storage.js',
	'./js/jokeService.js',
	'./js/audioController.js',
	'./js/uiController.js',
	'./js/app.js',
	'./robot.gif',
	'./favicon.png',
	'./icon-192.png',
	'./icon-512.png',
	'./icon-maskable-192.png',
	'./icon-maskable-512.png'
]

// Install: pre-cache the app shell
self.addEventListener('install', event => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then(cache => cache.addAll(STATIC_ASSETS))
			.then(() => self.skipWaiting())
	)
})

// Activate: delete caches from previous versions
self.addEventListener('activate', event => {
	event.waitUntil(
		caches
			.keys()
			.then(keys =>
				Promise.all(
					keys
						.filter(key => key.startsWith('joke-teller-') && key !== CACHE_NAME)
						.map(key => caches.delete(key))
				)
			)
			.then(() => self.clients.claim())
	)
})

// Fetch: try the network first, fall back to cache when offline
self.addEventListener('fetch', event => {
	if (event.request.method !== 'GET') return

	const requestUrl = new URL(event.request.url)

	// Let external requests (the joke API) go straight to the network
	if (requestUrl.origin !== location.origin) return

	event.respondWith(networkFirst(event.request))
})

/**
 * Network-first: fetch fresh from the network and update the cache.
 * If the network fails (offline), serve the last cached copy.
 */
async function networkFirst(request) {
	try {
		const response = await fetch(request)

		if (response.ok) {
			const cache = await caches.open(CACHE_NAME)
			cache.put(request, response.clone())
		}

		return response
	} catch {
		const cached = await caches.match(request)
		if (cached) return cached

		// Offline and nothing cached: show the offline page for page loads,
		// otherwise return a clear error response instead of undefined.
		if (request.mode === 'navigate') {
			return caches.match('./offline.html')
		}
		return Response.error()
	}
}
