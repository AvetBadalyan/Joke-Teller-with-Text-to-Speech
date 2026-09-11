/**
 * audioController.js — Text-to-speech via the browser's built-in Web Speech API
 *
 * No API key, no network call, works offline.
 *
 * Public functions:
 *   initAudio({ onStart, onEnd })  — wire up callbacks, populate voice dropdown
 *   speakJoke(text)                — speak a string; cancels any current speech
 *   previewVoice()                 — speak a short sample with the selected voice
 *   setVoice(voiceName)            — set the voice by name and persist the choice
 */

const synth = window.speechSynthesis

const PREVIEW_PHRASE = 'Hey there! Ready to hear some jokes?'

let onSpeechStart = () => {}
let onSpeechEnd = () => {}
let selectedVoice = null

function initAudio({ onStart, onEnd } = {}) {
	onSpeechStart = onStart ?? (() => {})
	onSpeechEnd = onEnd ?? (() => {})

	if (!synth) return

	// Chrome loads voices asynchronously — populate once they're ready
	const loadVoices = () => {
		const voices = synth.getVoices()
		if (!voices.length) return

		selectedVoice = pickVoice(voices)
		UI.populateVoiceDropdown(getVoiceOptions(voices), selectedVoice?.name ?? '')
	}

	loadVoices()
	synth.addEventListener('voiceschanged', loadVoices)
}

function speakJoke(text) {
	if (!synth || !text) return
	synth.cancel()
	const utterance = makeUtterance(text)
	utterance.onstart = () => onSpeechStart()
	utterance.onend = () => onSpeechEnd()
	utterance.onerror = () => onSpeechEnd()
	synth.speak(utterance)
}

function previewVoice() {
	if (!synth) return
	synth.cancel()
	synth.speak(makeUtterance(PREVIEW_PHRASE))
}

function makeUtterance(text) {
	const u = new SpeechSynthesisUtterance(text)
	u.rate = 1.05 // slightly faster — more lively
	u.pitch = 1.1 // higher pitch — sounds happier
	u.voice = selectedVoice
	return u
}

function setVoice(voiceName) {
	if (!synth) return
	const voice = synth.getVoices().find(v => v.name === voiceName)
	if (voice) {
		selectedVoice = voice
		Storage.set(CONFIG.storageKeys.selectedVoice, voiceName)
	}
}

// ─── Private helpers ────────────────────────────────────────────────────────

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
	return voices
		.filter(v => v.lang.startsWith('en'))
		.map(v => ({ name: v.name, lang: v.lang }))
}
