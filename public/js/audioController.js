/**
 * audioController.js — Text-to-speech via the browser's built-in voice
 *
 * Uses the Web Speech API (speechSynthesis) — no API key, no network call,
 * works offline. Two public functions:
 *
 *   initAudio({ onStart, onEnd })  — wire up callbacks once at startup
 *   speakJoke(text)                — speak a string; cancels any current speech
 *
 * The callbacks let app.js react while the robot is talking
 * (e.g. play the sound wave animation).
 */

const synth = window.speechSynthesis

let onSpeechStart = () => {}
let onSpeechEnd = () => {}

function initAudio({ onStart, onEnd } = {}) {
	onSpeechStart = onStart ?? (() => {})
	onSpeechEnd = onEnd ?? (() => {})

	// Chrome loads voices asynchronously — getVoices() is empty on the first
	// call and fills in later, firing "voiceschanged". Calling it here primes
	// the list so a voice is ready by the time the first joke plays.
	if (synth) {
		synth.getVoices()
		synth.addEventListener?.('voiceschanged', () => synth.getVoices())
	}
}

/**
 * Speak the given text aloud. Cancels anything already playing first,
 * so two jokes never overlap.
 * If the browser doesn't support speechSynthesis, this is a no-op
 * (the joke text is still shown on screen).
 */
function speakJoke(text) {
	if (!synth || !text) return

	synth.cancel() // stop any joke still speaking

	const utterance = new SpeechSynthesisUtterance(text)
	utterance.rate = 1
	utterance.pitch = 1
	utterance.voice = pickEnglishVoice()

	utterance.onstart = () => onSpeechStart()
	utterance.onend = () => onSpeechEnd()
	utterance.onerror = () => onSpeechEnd()

	synth.speak(utterance)
}

/**
 * Pick the first English voice available.
 * Falls back to the browser default (null) if none found.
 */
function pickEnglishVoice() {
	const voices = synth.getVoices()
	return voices.find(v => v.lang.startsWith('en')) ?? null
}
