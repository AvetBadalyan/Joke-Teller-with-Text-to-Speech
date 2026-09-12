/**
 * config.js — Central configuration
 */

const CONFIG = Object.freeze({
	jokeApi: {
		baseUrl: 'https://v2.jokeapi.dev/joke',
		excludedFlags: 'nsfw,religious,political,racist,sexist'
	},

	storageKeys: {
		savedJokes: 'jokeTeller_savedJokes',
		totalJokesHeard: 'jokeTeller_totalJokesHeard',
		colorTheme: 'jokeTeller_colorTheme',
		selectedVoice: 'jokeTeller_selectedVoice',
		selectedCategory: 'jokeTeller_selectedCategory'
	},

	timing: {
		typewriterCharDelay: 30,
		punchlineDelay: 500,
		toastVisibleDuration: 3000
	}
})
