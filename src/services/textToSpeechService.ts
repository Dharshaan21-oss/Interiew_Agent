/**
 * TEXT-TO-SPEECH (default: browser SpeechSynthesis — free, no key).
 * To use an external TTS (ElevenLabs, OpenAI TTS, Azure...): implement `TextToSpeechService`,
 * fetch audio from YOUR backend proxy, play it with `new Audio(url)`, and resolve when it ends.
 */
export interface TextToSpeechService {
  isSupported(): boolean
  speak(text: string): Promise<void> // resolves when finished (or cancelled)
  cancel(): void
}

class BrowserTTS implements TextToSpeechService {
  isSupported() { return 'speechSynthesis' in window }
  private pickVoice() {
    const v = speechSynthesis.getVoices().filter(x => x.lang.startsWith('en'))
    return v.find(x => /Google US English|Samantha|Aria|Jenny|Natural/i.test(x.name)) || v.find(x => x.lang === 'en-US') || v[0]
  }
  speak(text: string) {
    return new Promise<void>(resolve => {
      if (!this.isSupported()) return resolve()
      const go = () => {
        const u = new SpeechSynthesisUtterance(text)
        const voice = this.pickVoice()
        if (voice) u.voice = voice
        u.lang = 'en-US'; u.rate = 0.98; u.pitch = 1
        let done = false
        const fin = () => { if (!done) { done = true; clearInterval(keep); resolve() } }
        u.onend = fin; u.onerror = fin
        // Chrome pauses long utterances; nudge it
        const keep = setInterval(() => { if (speechSynthesis.speaking) { speechSynthesis.pause(); speechSynthesis.resume() } }, 10000)
        speechSynthesis.speak(u)
      }
      speechSynthesis.cancel()
      // voices load asynchronously in Chrome
      if (speechSynthesis.getVoices().length === 0) {
        let fired = false
        const once = () => { if (!fired) { fired = true; go() } }
        speechSynthesis.onvoiceschanged = once
        setTimeout(once, 400)
      } else setTimeout(go, 50)
    })
  }
  cancel() { if (this.isSupported()) speechSynthesis.cancel() }
}
export const textToSpeechService: TextToSpeechService = new BrowserTTS()
