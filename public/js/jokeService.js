/**
 * jokeService.js — Fetches and normalizes jokes from JokeAPI
 *
 * JokeAPI returns two joke types:
 *   "single"  — { joke: "..." }
 *   "twopart" — { setup: "...", delivery: "..." }
 *
 * We normalize both into a consistent shape for the rest of the app.
 */

let selectedApiCategory = 'Any'

const JokeService = {
	setCategory(apiCategorySlug) {
		selectedApiCategory = apiCategorySlug
	},

	async fetchJoke() {
		const { baseUrl, excludedFlags } = CONFIG.jokeApi
		const url = `${baseUrl}/${selectedApiCategory}?blacklistFlags=${excludedFlags}`

		const response = await fetch(url)
		if (!response.ok) {
			throw new Error(`JokeAPI responded with status ${response.status}`)
		}

		const data = await response.json()
		if (data.error) {
			throw new Error(data.message || 'JokeAPI returned an error')
		}

		return normalizeJoke(data)
	}
}

/**
 * Converts the raw API response into a consistent shape.
 */
function normalizeJoke(rawJoke) {
	const isTwoPart = rawJoke.type === 'twopart'
	return {
		id: rawJoke.id,
		apiCategory: rawJoke.category,
		type: rawJoke.type,
		setup: rawJoke.setup,
		punchline: rawJoke.delivery,
		singleText: rawJoke.joke,
		fullText: isTwoPart
			? `${rawJoke.setup} ... ${rawJoke.delivery}`
			: rawJoke.joke
	}
}
