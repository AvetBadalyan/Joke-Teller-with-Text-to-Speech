/**
 * config.js — Central configuration
 *
 * All app-wide settings live here: one place to change them.
 * TTS uses the browser's built-in speechSynthesis — no API key needed.
 * Jokes come from JokeAPI, a free public API (no auth required).
 */

const CONFIG = Object.freeze({
	// JokeAPI — https://jokeapi.dev
	jokeApi: {
		baseUrl: 'https://v2.jokeapi.dev/joke',
		// Joke flags to exclude from results
		excludedFlags: 'nsfw,religious,political,racist,sexist'
	},

	// Keys used to persist data in localStorage
	storageKeys: {
		savedJokes: 'jokeTeller_savedJokes',
		totalJokesHeard: 'jokeTeller_totalJokesHeard',
		colorTheme: 'jokeTeller_colorTheme',
		selectedVoice: 'jokeTeller_selectedVoice'
	},

	// UI timing in milliseconds
	timing: {
		typewriterCharDelay: 30, // delay between each character in the typewriter effect
		toastVisibleDuration: 3000 // how long a toast notification stays on screen
	}
})
