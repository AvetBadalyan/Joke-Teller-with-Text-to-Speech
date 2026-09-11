/**
 * storage.js — localStorage wrapper
 *
 * Handles JSON serialization and catches errors gracefully.
 * localStorage can fail in private/incognito mode or when the
 * storage quota is exceeded — we return safe defaults instead of crashing.
 */

const Storage = Object.freeze({
	/** Serialize and persist a value. Returns true on success. */
	set(key, value) {
		try {
			localStorage.setItem(key, JSON.stringify(value))
			return true
		} catch (err) {
			console.warn(`Storage.set("${key}") failed:`, err.message)
			return false
		}
	},

	/**
	 * Read and deserialize a value.
	 * Returns `fallback` if the key is missing or the value can't be parsed.
	 */
	get(key, fallback = null) {
		try {
			const raw = localStorage.getItem(key)
			return raw === null ? fallback : JSON.parse(raw)
		} catch (err) {
			console.warn(`Storage.get("${key}") failed:`, err.message)
			return fallback
		}
	},

	/** Remove a key from localStorage. */
	remove(key) {
		try {
			localStorage.removeItem(key)
		} catch (err) {
			console.warn(`Storage.remove("${key}") failed:`, err.message)
		}
	}
})
