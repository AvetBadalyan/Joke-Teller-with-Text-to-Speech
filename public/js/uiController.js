/**
 * uiController.js — All DOM updates live here
 *
 * This is the "view" layer. It only touches the DOM — no API calls,
 * no business logic, no state. app.js calls these functions to reflect
 * what happened.
 */

// Maps JokeAPI category slugs → user-friendly display labels.
// Keys match the data-category attributes in index.html exactly.
const CATEGORY_LABELS = {
	Any: '🎲 Random',
	Programming: '💻 Coding',
	Pun: '🥁 Dad Jokes',
	Spooky: '👻 Spooky',
	Christmas: '🎄 Holiday',
	Misc: '🎭 Miscellaneous'
}

// DOM element references — populated once by initUI()
let elements = {}

// Generation counter — incremented on every new joke to cancel stale typewriter chains
let jokeGeneration = 0

// ─────────────────────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────────────────────

function initUI() {
	elements = {
		// Joke card
		jokeCategoryBadge: document.getElementById('jokeCategoryBadge'),
		jokeSetupText: document.getElementById('jokeSetupText'),
		jokePunchlineText: document.getElementById('jokePunchlineText'),
		jokeSingleText: document.getElementById('jokeSingleText'),

		// Joke card action buttons
		saveJokeBtn: document.getElementById('saveJokeBtn'),
		saveJokeIcon: document.getElementById('saveJokeIcon'),
		shareJokeBtn: document.getElementById('shareJokeBtn'),
		copyJokeBtn: document.getElementById('copyJokeBtn'),

		// Main button
		tellJokeBtn: document.getElementById('tellJokeBtn'),

		// Header buttons
		themeToggleBtn: document.getElementById('themeToggleBtn'),
		savedJokesToggleBtn: document.getElementById('savedJokesToggleBtn'),

		// Category filter
		categoryButtons: document.querySelectorAll('.category-btn'),

		// Saved jokes sidebar
		savedJokesSidebar: document.getElementById('savedJokesSidebar'),
		savedJokesList: document.getElementById('savedJokesList'),
		savedJokesCount: document.getElementById('savedJokesCount'),
		savedJokesEmptyMsg: document.getElementById('savedJokesEmptyMsg'),
		closeSidebarBtn: document.getElementById('closeSidebarBtn'),
		sidebarOverlay: document.getElementById('sidebarOverlay'),
		clearSavedJokesBtn: document.getElementById('clearSavedJokesBtn'),

		// Stats
		totalJokesHeardCount: document.getElementById('totalJokesHeardCount'),

		// Robot + sound wave
		robotWrapper: document.getElementById('robotWrapper'),
		soundWave: document.getElementById('soundWave'),

		// Voice selector
		voiceSelect: document.getElementById('voiceSelect'),
		previewVoiceBtn: document.getElementById('previewVoiceBtn'),

		// Joke card sr-only live region (announced once, not character-by-character)
		jokeAnnouncement: document.getElementById('jokeAnnouncement'),

		// Toasts
		toastContainer: document.getElementById('toastContainer')
	}

	initTheme()
}

// ─────────────────────────────────────────────────────────────────────────────
// Joke display
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render a joke on the card with a typewriter animation.
 * Two-part jokes show the setup first, then the punchline after a short pause.
 */
function displayJoke(joke) {
	elements.jokeCategoryBadge.textContent =
		CATEGORY_LABELS[joke.apiCategory] ?? joke.apiCategory

	// Bump generation — any in-flight typewriter chain from a previous joke
	// will see its generation is stale and stop appending characters.
	const gen = ++jokeGeneration

	// Announce the complete joke text once to screen readers via the sr-only
	// live region, so they hear the full joke rather than character-by-character
	// updates from the visible typewriter elements.
	elements.jokeAnnouncement.textContent = joke.fullText

	// Clear previous visible text
	elements.jokeSetupText.textContent = ''
	elements.jokePunchlineText.textContent = ''
	elements.jokeSingleText.textContent = ''

	if (joke.type === 'twopart') {
		elements.jokeSingleText.hidden = true
		elements.jokeSetupText.hidden = false
		elements.jokePunchlineText.hidden = false

		typeText(elements.jokeSetupText, joke.setup, gen, () => {
			setTimeout(
				() => typeText(elements.jokePunchlineText, joke.punchline, gen),
				CONFIG.timing.punchlineDelay
			)
		})
	} else {
		elements.jokeSetupText.hidden = true
		elements.jokePunchlineText.hidden = true
		elements.jokeSingleText.hidden = false

		typeText(elements.jokeSingleText, joke.singleText, gen)
	}

	// Enable action buttons now that there's a joke to act on
	elements.saveJokeBtn.disabled = false
	elements.shareJokeBtn.disabled = false
	elements.copyJokeBtn.disabled = false
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading state
// ─────────────────────────────────────────────────────────────────────────────

function setLoading(isLoading) {
	elements.tellJokeBtn.disabled = isLoading
	elements.tellJokeBtn.classList.toggle('btn--is-loading', isLoading)
}

// ─────────────────────────────────────────────────────────────────────────────
// Robot + sound wave
// ─────────────────────────────────────────────────────────────────────────────

function setRobotSpeaking(isSpeaking) {
	elements.robotWrapper.classList.toggle('robot--is-speaking', isSpeaking)
	elements.soundWave.classList.toggle('sound-wave--is-active', isSpeaking)
}

// ─────────────────────────────────────────────────────────────────────────────
// Category filter
// ─────────────────────────────────────────────────────────────────────────────

function setActiveCategory(categorySlug) {
	elements.categoryButtons.forEach(btn => {
		btn.classList.toggle('active', btn.dataset.category === categorySlug)
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// Saved jokes sidebar
// ─────────────────────────────────────────────────────────────────────────────

function openSidebar() {
	elements.savedJokesSidebar.classList.add('is-open')
	elements.sidebarOverlay.classList.add('is-visible')
	elements.savedJokesSidebar.removeAttribute('inert')
	elements.savedJokesSidebar.setAttribute('aria-hidden', 'false')
	elements.savedJokesToggleBtn.setAttribute('aria-expanded', 'true')
	document.body.style.overflow = 'hidden'
	// Move focus into the sidebar so keyboard users aren't left behind the backdrop
	elements.closeSidebarBtn.focus()
}

function closeSidebar() {
	elements.savedJokesSidebar.classList.remove('is-open')
	elements.sidebarOverlay.classList.remove('is-visible')
	elements.savedJokesSidebar.setAttribute('inert', '')
	elements.savedJokesSidebar.setAttribute('aria-hidden', 'true')
	elements.savedJokesToggleBtn.setAttribute('aria-expanded', 'false')
	document.body.style.overflow = ''
	// Return focus to the button that opened the sidebar
	elements.savedJokesToggleBtn.focus()
}

function isSidebarOpen() {
	return elements.savedJokesSidebar.classList.contains('is-open')
}

/**
 * Re-render the saved jokes list.
 * @param {Array} savedJokes
 * @param {{ onRemove: Function, onPlay: Function }} callbacks
 */
function renderSavedJokes(savedJokes, callbacks) {
	elements.savedJokesCount.textContent = savedJokes.length

	if (savedJokes.length === 0) {
		// Clearing innerHTML first ensures the empty message element (which
		// lives in the DOM) is not duplicated if it was previously removed
		// by a prior innerHTML assignment and then re-appended here.
		elements.savedJokesList.innerHTML = ''
		elements.savedJokesList.appendChild(elements.savedJokesEmptyMsg)
		elements.savedJokesEmptyMsg.hidden = false
		elements.clearSavedJokesBtn.hidden = true
		return
	}

	elements.savedJokesEmptyMsg.hidden = true
	elements.clearSavedJokesBtn.hidden = false

	elements.savedJokesList.innerHTML = savedJokes
		.map(
			(joke, i) => `
        <div class="saved-joke-item" data-index="${i}">
          <span class="saved-joke-item__category">${escapeHtml(
						CATEGORY_LABELS[joke.apiCategory] ?? joke.apiCategory
					)}</span>
          <p class="saved-joke-item__text">${escapeHtml(joke.fullText)}</p>
          <div class="saved-joke-item__actions">
            <button class="btn btn--ghost" data-action="play" title="Read aloud" aria-label="Read joke aloud">🔊</button>
            <button class="btn btn--ghost" data-action="remove" title="Remove" aria-label="Remove joke">🗑️</button>
          </div>
        </div>`
		)
		.join('')

	// Attach click handlers via event delegation on the container
	elements.savedJokesList.querySelectorAll('[data-action]').forEach(btn => {
		btn.addEventListener('click', e => {
			const item = e.currentTarget.closest('.saved-joke-item')
			const index = Number(item.dataset.index)
			const action = e.currentTarget.dataset.action
			if (action === 'play') callbacks.onPlay(savedJokes[index])
			if (action === 'remove') callbacks.onRemove(index)
		})
	})
}

function setSaveButtonState(isSaved) {
	elements.saveJokeIcon.textContent = isSaved ? '❤️' : '🤍'
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────────────────────

function updateTotalJokesHeard(count) {
	elements.totalJokesHeardCount.textContent = count
}

// ─────────────────────────────────────────────────────────────────────────────
// Voice selector
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Populate the voice dropdown with available voices.
 * @param {Array} voices - Array of { name, lang } from audioController.getVoices()
 * @param {string} selectedName - Currently selected voice name
 */
function populateVoiceDropdown(voices, selectedName) {
	const select = elements.voiceSelect
	if (!select) return

	if (voices.length === 0) {
		select.innerHTML = '<option value="">No voices available</option>'
		return
	}

	select.innerHTML = voices
		.map(
			v =>
				`<option value="${v.name}"${v.name === selectedName ? ' selected' : ''}>${v.name}</option>`
		)
		.join('')
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme
// ─────────────────────────────────────────────────────────────────────────────

function initTheme() {
	const saved = Storage.get(CONFIG.storageKeys.colorTheme)
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
	document.documentElement.dataset.theme =
		saved ?? (prefersDark ? 'dark' : 'light')
}

function toggleTheme() {
	const html = document.documentElement
	const newTheme = html.dataset.theme === 'dark' ? 'light' : 'dark'
	html.dataset.theme = newTheme
	Storage.set(CONFIG.storageKeys.colorTheme, newTheme)
	return newTheme
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast notifications
// ─────────────────────────────────────────────────────────────────────────────

function showToast(message, type = 'info') {
	const icons = { success: '✅', error: '❌', info: 'ℹ️' }

	const toast = document.createElement('div')
	toast.className = `toast toast--${type}`
	toast.innerHTML = `
    <span class="toast__icon">${icons[type] ?? icons.info}</span>
    <span class="toast__message">${escapeHtml(message)}</span>`

	elements.toastContainer.appendChild(toast)

	setTimeout(() => {
		toast.style.opacity = '0'
		toast.style.transform = 'translateX(100%)'
		setTimeout(() => toast.remove(), 300)
	}, CONFIG.timing.toastVisibleDuration)
}

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Escape a string for safe insertion into innerHTML.
 * Joke text comes from a third-party API and toast messages can contain
 * arbitrary content, so we neutralise any HTML before rendering it.
 */
function escapeHtml(value) {
	const div = document.createElement('div')
	div.textContent = String(value ?? '')
	return div.innerHTML
}

/**
 * Typewriter effect — appends text one character at a time.
 * @param {HTMLElement} el      - Target element to type into.
 * @param {string}      text    - Text to type.
 * @param {number}      gen     - Generation stamp; stops if a newer joke has started.
 * @param {Function}   [onDone] - Optional callback fired when typing finishes.
 */
function typeText(el, text, gen, onDone) {
	let i = 0
	el.classList.add('typing-cursor')

	function next() {
		// A new joke has been requested — stop this stale chain immediately
		if (gen !== jokeGeneration) {
			el.classList.remove('typing-cursor')
			return
		}
		if (i < text.length) {
			el.textContent += text[i++]
			setTimeout(next, CONFIG.timing.typewriterCharDelay)
		} else {
			el.classList.remove('typing-cursor')
			if (onDone) onDone()
		}
	}

	next()
}

// ─────────────────────────────────────────────────────────────────────────────
// Export for app.js
// ─────────────────────────────────────────────────────────────────────────────

// Grouped as UI so app.js can call UI.init(), UI.displayJoke(), UI.elements, etc.
const UI = {
	// elements is accessed after init() populates it
	get elements() {
		return elements
	},
	init: initUI,
	displayJoke,
	setLoading,
	setRobotSpeaking,
	setActiveCategory,
	openSidebar,
	closeSidebar,
	isSidebarOpen,
	renderSavedJokes,
	setSaveButtonState,
	updateTotalJokesHeard,
	populateVoiceDropdown,
	toggleTheme,
	showToast
}
