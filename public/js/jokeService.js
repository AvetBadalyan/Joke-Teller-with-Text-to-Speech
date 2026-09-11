/**
 * jokeService.js — Fetches and normalizes jokes from JokeAPI
 *
 * Responsible for one thing: getting a joke from the API and
 * returning it in a consistent shape regardless of joke type.
 *
 * JokeAPI returns two joke types:
 *   "single"  — { joke: "..." }
 *   "twopart" — { setup: "...", delivery: "..." }
 *
 * We normalize both into one shape:
 *   {
 *     id,           — unique joke ID from the API
 *     apiCategory,  — the raw API category slug (e.g. "Programming", "Pun")
 *     type,         — "single" or "twopart"
 *     setup,        — first part of a twopart joke, null for single
 *     punchline,    — second part of a twopart joke, null for single
 *     text,         — the full text of a single joke, null for twopart
 *     fullText      — the complete joke as one string (used for TTS and sharing)
 *   }
 *
 * Note on apiCategory values: these are the slugs the API expects in the URL.
 * Human-readable display labels are in uiController (CATEGORY_DISPLAY_LABELS).
 */

// The API category slug sent in the URL. "Any" means no filter.
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
 * Both joke types end up with the same fields so the rest of the
 * app never has to branch on joke type except when displaying text.
 */
function normalizeJoke(rawJoke) {
	const isTwoPart = rawJoke.type === 'twopart'

	return {
		id: rawJoke.id,
		apiCategory: rawJoke.category, // raw API slug — display label is derived in the UI layer
		type: rawJoke.type,
		setup: rawJoke.setup ?? null,
		punchline: rawJoke.delivery ?? null, // "delivery" in the API = the punchline
		text: rawJoke.joke ?? null,
		fullText: isTwoPart
			? `${rawJoke.setup} ... ${rawJoke.delivery}`
			: rawJoke.joke
	}
}
