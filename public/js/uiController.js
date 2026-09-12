/**
 * uiController.js — DOM updates
 *
 * The "view" layer: no API calls, no business logic, no state.
 * app.js calls these functions to reflect what happened.
 */

// Category display labels (keys match data-category in HTML)
const CATEGORY_LABELS = {
	Any: '🎲 Random',
	Programming: '💻 Coding',
	Pun: '😂 Wordplay',
	Dark: '🌑 Dark',
	Spooky: '🎃 Halloween',
	Christmas: '🎄 Holiday',
	Misc: '🎭 Other'
}

let elements = {}
let jokeGeneration = 0
let savedJokesCallbacks = { onPlay: () => {}, onRemove: () => {} }
let savedJokesData = []

// ─────────────────────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────────────────────

function initUI() {
	elements = {
		jokeCategoryBadge: document.getElementById('jokeCategoryBadge'),
		jokeSetupText: document.getElementById('jokeSetupText'),
		jokePunchlineText: document.getElementById('jokePunchlineText'),
		jokeSingleText: document.getElementById('jokeSingleText'),
		saveJokeBtn: document.getElementById('saveJokeBtn'),
		saveJokeIcon: document.getElementById('saveJokeIcon'),
		shareJokeBtn: document.getElementById('shareJokeBtn'),
		copyJokeBtn: document.getElementById('copyJokeBtn'),
		tellJokeBtn: document.getElementById('tellJokeBtn'),
		themeToggleBtn: document.getElementById('themeToggleBtn'),
		savedJokesToggleBtn: document.getElementById('savedJokesToggleBtn'),
		categoryButtons: document.querySelectorAll('.category-btn'),
		savedJokesSidebar: document.getElementById('savedJokesSidebar'),
		savedJokesList: document.getElementById('savedJokesList'),
		savedJokesCount: document.getElementById('savedJokesCount'),
		savedJokesEmptyMsg: document.getElementById('savedJokesEmptyMsg'),
		closeSidebarBtn: document.getElementById('closeSidebarBtn'),
		sidebarOverlay: document.getElementById('sidebarOverlay'),
		clearSavedJokesBtn: document.getElementById('clearSavedJokesBtn'),
		totalJokesHeardCount: document.getElementById('totalJokesHeardCount'),
		robotWrapper: document.getElementById('robotWrapper'),
		soundWave: document.getElementById('soundWave'),
		voiceSelect: document.getElementById('voiceSelect'),
		previewVoiceBtn: document.getElementById('previewVoiceBtn'),
		jokeAnnouncement: document.getElementById('jokeAnnouncement'),
		toastContainer: document.getElementById('toastContainer'),
		confirmModal: document.getElementById('confirmModal'),
		confirmModalOverlay: document.getElementById('confirmModalOverlay'),
		confirmModalTitle: document.getElementById('confirmModalTitle'),
		confirmModalMessage: document.getElementById('confirmModalMessage'),
		confirmModalConfirmBtn: document.getElementById('confirmModalConfirmBtn'),
		confirmModalCancelBtn: document.getElementById('confirmModalCancelBtn')
	}

	initTheme()

	// Delegated click listener for saved jokes list
	elements.savedJokesList.addEventListener('click', e => {
		const btn = e.target.closest('[data-action]')
		if (!btn) return
		const item = btn.closest('.saved-joke-item')
		if (!item) return
		const index = Number(item.dataset.index)
		const action = btn.dataset.action
		if (action === 'play') savedJokesCallbacks.onPlay(savedJokesData[index])
		if (action === 'remove') savedJokesCallbacks.onRemove(index)
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// Joke display
// ─────────────────────────────────────────────────────────────────────────────

/** Render a joke with typewriter animation */
function displayJoke(joke) {
	elements.jokeCategoryBadge.textContent =
		CATEGORY_LABELS[joke.apiCategory] ?? joke.apiCategory

	const gen = ++jokeGeneration

	// Full text for screen readers (no character-by-character)
	elements.jokeAnnouncement.textContent = joke.fullText

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
// Sidebar
// ─────────────────────────────────────────────────────────────────────────────

function openSidebar() {
	elements.savedJokesSidebar.classList.add('is-open')
	elements.sidebarOverlay.classList.add('is-visible')
	elements.savedJokesSidebar.removeAttribute('inert')
	elements.savedJokesSidebar.setAttribute('aria-hidden', 'false')
	elements.savedJokesToggleBtn.setAttribute('aria-expanded', 'true')
	document.body.style.overflow = 'hidden'
	elements.closeSidebarBtn.focus()
}

function closeSidebar() {
	elements.savedJokesSidebar.classList.remove('is-open')
	elements.sidebarOverlay.classList.remove('is-visible')
	elements.savedJokesSidebar.setAttribute('inert', '')
	elements.savedJokesSidebar.setAttribute('aria-hidden', 'true')
	elements.savedJokesToggleBtn.setAttribute('aria-expanded', 'false')
	document.body.style.overflow = ''
	elements.savedJokesToggleBtn.focus()
}

function isSidebarOpen() {
	return elements.savedJokesSidebar.classList.contains('is-open')
}

function isConfirmOpen() {
	return elements.confirmModal.classList.contains('is-open')
}

/** Render the saved jokes list */
function renderSavedJokes(savedJokes, callbacks) {
	savedJokesData = savedJokes
	savedJokesCallbacks = callbacks

	elements.savedJokesCount.textContent = savedJokes.length

	if (savedJokes.length === 0) {
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

function populateVoiceDropdown(voices, selectedName) {
	const select = elements.voiceSelect
	if (!select) return

	if (voices.length === 0) {
		select.innerHTML = '<option value="">No voices available</option>'
		return
	}

	select.innerHTML = voices
		.map(
			name =>
				`<option value="${name}"${name === selectedName ? ' selected' : ''}>${name}</option>`
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
// Confirmation modal
// ─────────────────────────────────────────────────────────────────────────────

let confirmModalCleanup = null

/**
 * Themed replacement for the native confirm().
 * Returns a Promise that resolves to true (confirm) or false (cancel).
 *
 * @param {Object} [options]
 * @param {string} [options.title]       Heading text.
 * @param {string} [options.message]     Body text.
 * @param {string} [options.confirmText] Confirm button label.
 * @param {string} [options.cancelText]  Cancel button label.
 */
function confirmDialog({
	title = 'Are you sure?',
	message = '',
	confirmText = 'Confirm',
	cancelText = 'Cancel'
} = {}) {
	const {
		confirmModal,
		confirmModalOverlay,
		confirmModalTitle,
		confirmModalMessage,
		confirmModalConfirmBtn,
		confirmModalCancelBtn
	} = elements

	// Guard against overlapping dialogs
	if (confirmModalCleanup) confirmModalCleanup()

	confirmModalTitle.textContent = title
	confirmModalMessage.textContent = message
	confirmModalConfirmBtn.textContent = confirmText
	confirmModalCancelBtn.textContent = cancelText

	const previouslyFocused = document.activeElement

	confirmModal.classList.add('is-open')
	confirmModal.removeAttribute('inert')
	confirmModal.setAttribute('aria-hidden', 'false')
	document.body.style.overflow = 'hidden'
	confirmModalConfirmBtn.focus()

	return new Promise(resolve => {
		const close = result => {
			confirmModal.classList.remove('is-open')
			confirmModal.setAttribute('inert', '')
			confirmModal.setAttribute('aria-hidden', 'true')
			document.body.style.overflow = ''

			confirmModalConfirmBtn.removeEventListener('click', onConfirm)
			confirmModalCancelBtn.removeEventListener('click', onCancel)
			confirmModalOverlay.removeEventListener('click', onCancel)
			document.removeEventListener('keydown', onKeydown, true)
			confirmModalCleanup = null

			if (previouslyFocused?.focus) previouslyFocused.focus()
			resolve(result)
		}

		const onConfirm = () => close(true)
		const onCancel = () => close(false)
		const onKeydown = e => {
			if (e.key === 'Escape') {
				e.stopPropagation()
				onCancel()
			}
		}

		confirmModalConfirmBtn.addEventListener('click', onConfirm)
		confirmModalCancelBtn.addEventListener('click', onCancel)
		confirmModalOverlay.addEventListener('click', onCancel)
		// Capture phase so Escape closes the modal before the app's global handler
		document.addEventListener('keydown', onKeydown, true)

		// Exposed so a second confirmDialog() call can force-close this one
		confirmModalCleanup = () => close(false)
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Escape HTML to prevent XSS */
function escapeHtml(value) {
	const div = document.createElement('div')
	div.textContent = String(value ?? '')
	return div.innerHTML
}

/** Typewriter effect — stops if a newer joke starts (gen mismatch) */
function typeText(el, text, gen, onDone) {
	let i = 0
	el.classList.add('typing-cursor')

	function next() {
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
// Export
// ─────────────────────────────────────────────────────────────────────────────

const UI = {
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
	isConfirmOpen,
	renderSavedJokes,
	setSaveButtonState,
	updateTotalJokesHeard,
	populateVoiceDropdown,
	toggleTheme,
	showToast,
	confirm: confirmDialog
}
