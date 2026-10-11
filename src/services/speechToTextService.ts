/**
 * SPEECH-TO-TEXT (default: browser Web Speech API — free, no key; best in Chrome/Edge/Safari).
 * To use an external STT (Whisper, Deepgram, Google...): keep this same `SpeechToTextService`
 * interface, record audio with MediaRecorder, POST it to YOUR backend (which holds the secret key),
 * and call handlers.onText(transcript) / handlers.onEnd().
 */
export interface STTHandlers {
  onText: (fullTranscript: string) => void // called repeatedly with interim + final text
  onEnd: () => void
  onError: (code: string) => void
}
export interface SpeechToTextService {
  isSupported(): boolean
  start(h: STTHandlers): boolean
  stop(): void
  abort(): void
}

const Ctor = () => (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

class BrowserSTT implements SpeechToTextService {
  private rec: any = null
  isSupported() { return !!Ctor() }
  start(h: STTHandlers) {
    const C = Ctor()
    if (!C) return false
    this.abort()
    const rec = new C()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    let finals = ''
    rec.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finals += t + ' '
        else interim += t
      }
      h.onText((finals + interim).trim())
    }
    rec.onerror = (e: any) => h.onError(e.error)
    rec.onend = () => { this.rec = null; h.onEnd() }
    try { rec.start() } catch { h.onError('start-failed'); return false }
    this.rec = rec
    return true
  }
  stop() { try { this.rec?.stop() } catch { /* noop */ } }
  abort() { const r = this.rec; this.rec = null; if (r) { r.onend = null; r.onerror = null; try { r.abort() } catch { /* noop */ } } }
}
export const speechToTextService: SpeechToTextService = new BrowserSTT()
