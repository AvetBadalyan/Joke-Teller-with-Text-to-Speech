/**
 * app.js — Application entry point
 *
 * Wires everything together: handles user interactions,
 * delegates DOM updates to UI, data fetching to JokeService,
 * and persistence to Storage.
 */

let currentJoke = null
let savedJokes = []
let totalJokesHeard = 0
let isFetchingJoke = false

// --- Init --------------------------------------------------------------------

function init() {
	UI.init()

	AudioController.init({
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

	const savedCategory = Storage.get(CONFIG.storageKeys.selectedCategory, 'Any')
	selectCategory(savedCategory)
}

function attachEventListeners() {
	const elements = UI.elements

	elements.tellJokeBtn.addEventListener('click', fetchAndShowJoke)

	elements.categoryButtons.forEach(btn => {
		btn.addEventListener('click', () => selectCategory(btn.dataset.category))
	})

	elements.saveJokeBtn.addEventListener('click', toggleSaveCurrentJoke)
	elements.shareJokeBtn.addEventListener('click', shareCurrentJoke)
	elements.copyJokeBtn.addEventListener('click', copyCurrentJoke)

	elements.themeToggleBtn.addEventListener('click', () => {
		const newTheme = UI.toggleTheme()
		UI.showToast(`Switched to ${newTheme} mode`, 'info')
	})

	elements.savedJokesToggleBtn.addEventListener('click', UI.openSidebar)
	elements.closeSidebarBtn.addEventListener('click', UI.closeSidebar)
	elements.sidebarOverlay.addEventListener('click', UI.closeSidebar)
	elements.clearSavedJokesBtn.addEventListener('click', clearAllSavedJokes)

	// Voice selector
	elements.voiceSelect.addEventListener('change', e => {
		AudioController.setVoice(e.target.value)
	})
	elements.previewVoiceBtn.addEventListener(
		'click',
		AudioController.previewVoice
	)

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
		AudioController.speakJoke(currentJoke.fullText)
	} catch {
		UI.showToast(
			'Could not fetch a joke — check your connection and try again.',
			'error'
		)
	} finally {
		UI.setLoading(false)
		isFetchingJoke = false
	}
}

function selectCategory(apiCategorySlug) {
	JokeService.setCategory(apiCategorySlug)
	UI.setActiveCategory(apiCategorySlug)
	Storage.set(CONFIG.storageKeys.selectedCategory, apiCategorySlug)
}

// --- Saving ------------------------------------------------------------------

function toggleSaveCurrentJoke() {
	if (!currentJoke) return

	const existingIndex = savedJokes.findIndex(j => j.id === currentJoke.id)

	if (existingIndex === -1) {
		savedJokes.unshift({ ...currentJoke, savedAt: Date.now() })
		UI.setSaveButtonState(true)
		UI.showToast('Saved to your collection!', 'success')
	} else {
		savedJokes.splice(existingIndex, 1)
		UI.setSaveButtonState(false)
		UI.showToast('Removed from your collection', 'info')
	}

	persistSavedJokes()
}

function removeSavedJoke(index) {
	savedJokes.splice(index, 1)
	persistSavedJokes()
	if (currentJoke) UI.setSaveButtonState(isJokeSaved(currentJoke))
}

async function clearAllSavedJokes() {
	const confirmed = await UI.confirm({
		title: 'Clear saved jokes?',
		message:
			'This removes every joke in your collection. This cannot be undone.',
		confirmText: 'Clear all',
		cancelText: 'Cancel'
	})
	if (!confirmed) return

	savedJokes = []
	Storage.remove(CONFIG.storageKeys.savedJokes)
	UI.renderSavedJokes(savedJokes, {
		onRemove: removeSavedJoke,
		onPlay: playSavedJoke
	})
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

function playSavedJoke(joke) {
	currentJoke = joke
	UI.displayJoke(joke)
	UI.setSaveButtonState(true)
	UI.closeSidebar()
	AudioController.speakJoke(joke.fullText)
}

function isJokeSaved(joke) {
	return savedJokes.some(j => j.id === joke.id)
}

// --- Share & Copy ------------------------------------------------------------

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
			if (err.name !== 'AbortError') copyCurrentJoke()
		}
	} else {
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

// --- Keyboard ----------------------------------------------------------------

function handleKeyboardShortcut(event) {
	if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return

	// Confirmation modal handles its own keys (Escape closes it via capture phase)
	if (UI.isConfirmOpen()) return

	// While the sidebar is open, only Escape is allowed (closes the sidebar)
	if (UI.isSidebarOpen()) {
		if (event.code === 'Escape') UI.closeSidebar()
		return
	}

	switch (event.code) {
		case 'Space':
			// Skip if the button itself is focused — it will fire its own click event
			if (event.target !== UI.elements.tellJokeBtn) {
				event.preventDefault()
				fetchAndShowJoke()
			}
			break
		case 'KeyF':
			toggleSaveCurrentJoke()
			break
		case 'KeyC':
			copyCurrentJoke()
			break
	}
}

// --- Bootstrap ---------------------------------------------------------------

document.addEventListener('DOMContentLoaded', init)
