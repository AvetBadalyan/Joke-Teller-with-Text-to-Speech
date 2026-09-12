/**
 * storage.js — localStorage wrapper with JSON serialization
 */

const Storage = Object.freeze({
	set(key, value) {
		try {
			localStorage.setItem(key, JSON.stringify(value))
			return true
		} catch (err) {
			console.warn(`Storage.set("${key}") failed:`, err.message)
			return false
		}
	},

	get(key, fallback = null) {
		try {
			const raw = localStorage.getItem(key)
			return raw === null ? fallback : JSON.parse(raw)
		} catch (err) {
			console.warn(`Storage.get("${key}") failed:`, err.message)
			return fallback
		}
	},

	remove(key) {
		try {
			localStorage.removeItem(key)
		} catch (err) {
			console.warn(`Storage.remove("${key}") failed:`, err.message)
		}
	}
})
