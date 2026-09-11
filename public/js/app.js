/**
 * app.js — Application entry point
 *
 * The "controller" that wires everything together:
 * - Owns app state (current joke, saved jokes, total jokes heard)
 * - Handles all user interactions
 * - Delegates DOM updates to UI (uiController)
 * - Delegates data fetching to JokeService
 * - Delegates persistence to Storage
 */

// --- App state ---------------------------------------------------------------

let currentJoke = null // the joke currently shown on the card
let savedJokes = [] // jokes the user has saved (persisted to localStorage)
let totalJokesHeard = 0 // running count of jokes fetched this session (persisted)
let isFetchingJoke = false // guard flag to prevent overlapping fetch requests

// --- Initialisation ----------------------------------------------------------

function init() {
	UI.init()

	initAudio({
		onStart: () => UI.setRobotSpeaking(true),
		onEnd: () => UI.setRobotSpeaking(false)
	})

	loadPersistedData()
	attachEventListeners()
}

function loadPersistedData() {
	savedJokes = Storage.get(CONFIG.storageKeys.savedJokes, [])
	UI.renderSavedJokes(savedJokes, {
		onRemove: removeSavedJoke,
		onPlay: playSavedJoke
	})

	totalJokesHeard = Storage.get(CONFIG.storageKeys.totalJokesHeard, 0)
	UI.updateTotalJokesHeard(totalJokesHeard)
}

function attachEventListeners() {
	const el = UI.elements

	el.tellJokeBtn.addEventListener('click', fetchAndShowJoke)

	el.categoryButtons.forEach(btn => {
		btn.addEventListener('click', () => selectCategory(btn.dataset.category))
	})

	el.saveJokeBtn.addEventListener('click', toggleSaveCurrentJoke)
	el.shareJokeBtn.addEventListener('click', shareCurrentJoke)
	el.copyJokeBtn.addEventListener('click', copyCurrentJoke)

	el.themeToggleBtn.addEventListener('click', () => {
		const newTheme = UI.toggleTheme()
		UI.showToast(`Switched to ${newTheme} mode`, 'info')
	})

	el.savedJokesToggleBtn.addEventListener('click', UI.openSidebar)
	el.closeSidebarBtn.addEventListener('click', UI.closeSidebar)
	el.sidebarOverlay.addEventListener('click', UI.closeSidebar)
	el.clearSavedJokesBtn.addEventListener('click', clearAllSavedJokes)

	document.addEventListener('keydown', handleKeyboardShortcut)
}

// --- Joke flow ---------------------------------------------------------------

async function fetchAndShowJoke() {
	if (isFetchingJoke) return
	isFetchingJoke = true
	UI.setLoading(true)

	try {
		currentJoke = await JokeService.fetchJoke()

		UI.displayJoke(currentJoke)
		UI.setSaveButtonState(isJokeSaved(currentJoke))
		incrementTotalJokesHeard()

		speakJoke(currentJoke.fullText)
	} catch {
		UI.showToast(
			'Could not fetch a joke — check your connection and try again.',
			'error'
		)
	} finally {
		// The button re-enables as soon as the joke text appears on screen.
		// It does NOT wait for the audio to finish.
		UI.setLoading(false)
		isFetchingJoke = false
	}
}

function selectCategory(apiCategorySlug) {
	JokeService.setCategory(apiCategorySlug)
	UI.setActiveCategory(apiCategorySlug)
}

// --- Saving jokes ------------------------------------------------------------

function toggleSaveCurrentJoke() {
	if (!currentJoke) return

	const existingIndex = savedJokes.findIndex(j => j.id === currentJoke.id)

	if (existingIndex === -1) {
		// Not saved yet — add it to the front of the list
		savedJokes.unshift({ ...currentJoke, savedAt: Date.now() })
		UI.setSaveButtonState(true)
		UI.showToast('Saved to your collection!', 'success')
	} else {
		// Already saved — remove it
		savedJokes.splice(existingIndex, 1)
		UI.setSaveButtonState(false)
		UI.showToast('Removed from your collection', 'info')
	}

	persistSavedJokes()
}

function removeSavedJoke(index) {
	savedJokes.splice(index, 1)
	persistSavedJokes()
	// Keep the save button in sync if the removed joke is the one on screen
	if (currentJoke) UI.setSaveButtonState(isJokeSaved(currentJoke))
}

function clearAllSavedJokes() {
	if (!confirm('Remove all saved jokes?')) return
	savedJokes = []
	persistSavedJokes()
	if (currentJoke) UI.setSaveButtonState(false)
	UI.showToast('All saved jokes removed', 'info')
}

function persistSavedJokes() {
	Storage.set(CONFIG.storageKeys.savedJokes, savedJokes)
	UI.renderSavedJokes(savedJokes, {
		onRemove: removeSavedJoke,
		onPlay: playSavedJoke
	})
}

/** Read a saved joke aloud and show it on the card. */
function playSavedJoke(joke) {
	currentJoke = joke
	UI.displayJoke(joke)
	UI.setSaveButtonState(true)
	UI.closeSidebar()
	speakJoke(joke.fullText)
}

function isJokeSaved(joke) {
	return savedJokes.some(j => j.id === joke.id)
}

// --- Share & copy ------------------------------------------------------------

async function shareCurrentJoke() {
	if (!currentJoke) return

	if (navigator.share) {
		try {
			await navigator.share({
				title: 'Check out this joke!',
				text: currentJoke.fullText,
				url: window.location.href
			})
		} catch (err) {
			// User cancelled the share sheet — not an error worth showing
			if (err.name !== 'AbortError') copyCurrentJoke()
		}
	} else {
		// Web Share API not available — fall back to clipboard
		copyCurrentJoke()
	}
}

async function copyCurrentJoke() {
	if (!currentJoke) return

	try {
		await navigator.clipboard.writeText(currentJoke.fullText)
		UI.showToast('Copied to clipboard!', 'success')
	} catch {
		UI.showToast('Could not copy to clipboard', 'error')
	}
}

// --- Stats -------------------------------------------------------------------

function incrementTotalJokesHeard() {
	totalJokesHeard++
	Storage.set(CONFIG.storageKeys.totalJokesHeard, totalJokesHeard)
	UI.updateTotalJokesHeard(totalJokesHeard)
}

// --- Keyboard shortcuts ------------------------------------------------------

function handleKeyboardShortcut(event) {
	// Ignore shortcuts when the user is typing in a form field
	if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')
		return

	switch (event.code) {
		case 'Space':
			event.preventDefault()
			fetchAndShowJoke()
			break
		case 'KeyF':
			toggleSaveCurrentJoke()
			break
		case 'KeyC':
			copyCurrentJoke()
			break
		case 'Escape':
			UI.closeSidebar()
			break
	}
}

// --- Bootstrap ---------------------------------------------------------------

document.addEventListener('DOMContentLoaded', init)
