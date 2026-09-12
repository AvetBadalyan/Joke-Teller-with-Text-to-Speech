/**
 * audioController.js — Text-to-speech via the Web Speech API
 *
 * No API key, no network call, works offline.
 *
 * The "audio" layer: app.js calls these functions to speak jokes,
 * preview voices, and change the active voice.
 */

const synth = window.speechSynthesis
const PREVIEW_PHRASE = 'Hey there! Ready to hear some jokes?'

let onSpeechStart = () => {}
let onSpeechEnd = () => {}
let selectedVoice = null

// ─────────────────────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────────────────────

function initAudio({ onStart, onEnd } = {}) {
	onSpeechStart = onStart ?? (() => {})
	onSpeechEnd = onEnd ?? (() => {})

	if (!synth) return

	const loadVoices = () => {
		const voices = synth.getVoices()
		if (!voices.length) return

		selectedVoice = pickVoice(voices)
		UI.populateVoiceDropdown(getVoiceOptions(voices), selectedVoice?.name ?? '')
	}

	loadVoices()
	synth.addEventListener('voiceschanged', loadVoices)
}

// ─────────────────────────────────────────────────────────────────────────────
// Speech
// ─────────────────────────────────────────────────────────────────────────────

function speakJoke(text) {
	speak(text)
}

function previewVoice() {
	speak(PREVIEW_PHRASE)
}

function setVoice(voiceName) {
	if (!synth) return
	const voice = synth.getVoices().find(v => v.name === voiceName)
	if (voice) {
		selectedVoice = voice
		Storage.set(CONFIG.storageKeys.selectedVoice, voiceName)
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Speak text with robot animation callbacks */
function speak(text) {
	if (!synth || !text) return
	synth.cancel()

	const utterance = new SpeechSynthesisUtterance(text)
	utterance.rate = 1.05
	utterance.pitch = 1.1
	utterance.voice = selectedVoice
	utterance.onstart = () => onSpeechStart()
	utterance.onend = () => onSpeechEnd()
	utterance.onerror = () => onSpeechEnd()

	synth.speak(utterance)
}

/**
 * Pick the default voice. Respects a saved preference; otherwise uses
 * the first English voice the browser provides.
 */
function pickVoice(voices) {
	const english = voices.filter(v => v.lang.startsWith('en'))
	if (!english.length) return null

	const saved = Storage.get(CONFIG.storageKeys.selectedVoice)
	if (saved) {
		const match = english.find(v => v.name === saved)
		if (match) return match
	}

	return english[0]
}

/**
 * Return all English voices for the dropdown.
 */
function getVoiceOptions(voices) {
	return voices.filter(v => v.lang.startsWith('en')).map(v => v.name)
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

const AudioController = {
	init: initAudio,
	speakJoke,
	previewVoice,
	setVoice
}
