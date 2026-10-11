import { useEffect, useRef, useState } from 'react'
import { Mic, Square, Volume2, RotateCcw, ArrowRight, ArrowLeft, Coffee, Code2, BarChart3, Brain, Cpu, Globe, Database, Terminal, Check, AlertTriangle, ChevronDown } from 'lucide-react'
import { ROLES, Role, buildQuestions, intro, transition, finalSpeech } from './services/interviewService'
import { evaluateAnswer, summarize, AnswerEval } from './services/evaluationService'
import { speechToTextService as stt } from './services/speechToTextService'
import { textToSpeechService as tts } from './services/textToSpeechService'

type View = 'landing' | 'roles' | 'setup' | 'room' | 'results'
type Phase = 'speaking' | 'idle' | 'listening' | 'processing' | 'feedback'
type Result = AnswerEval & { question: string; answer: string }
const ICONS: Record<string, any> = { java: Coffee, python: Code2, ds: BarChart3, mle: Brain, ai: Cpu, web: Globe, da: Database, se: Terminal }
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const card = 'rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur'
const btn = 'inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400'
const primary = `${btn} bg-indigo-500 text-white hover:bg-indigo-400 shadow-[0_0_30px_-5px_rgba(99,102,241,.6)] disabled:opacity-40`
const ghost = `${btn} border border-white/15 text-slate-200 hover:bg-white/5`

function Orb({ state }: { state: Phase }) {
  const cls = state === 'speaking' ? 'o-speaking' : state === 'listening' ? 'o-listening' : state === 'processing' ? 'o-processing' : ''
  return (
    <div className="relative grid h-52 w-52 place-items-center sm:h-64 sm:w-64" aria-hidden>
      <div className={`absolute inset-0 rounded-full bg-indigo-500/20 blur-3xl ${cls}`} />
      <div className={`h-3/4 w-3/4 rounded-full ${cls}`} style={{ background: 'radial-gradient(circle at 35% 30%, #a5b4fc, #6366f1 40%, #7c3aed 70%, #1e1b4b)', boxShadow: '0 0 80px rgba(99,102,241,.5), inset 0 0 40px rgba(255,255,255,.15)' }} />
    </div>
  )
}
function Wave({ on }: { on: boolean }) {
  return <div className="flex h-10 items-center gap-1" aria-hidden>{Array.from({ length: 28 }).map((_, i) => (
    <span key={i} className={`w-1 rounded-full bg-indigo-400 ${on ? 'bar' : ''}`} style={{ height: 36, transform: on ? undefined : 'scaleY(.12)', animationDelay: `${(i % 9) * 0.1}s`, opacity: on ? 1 : .4 }} />))}</div>
}
function Nav({ go, cta = true }: { go: (v: View) => void; cta?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-[#05070f]/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4" aria-label="Main">
        <button onClick={() => go('landing')} className="flex items-center gap-2 font-semibold tracking-tight"><span className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-300 to-violet-600" />VoxHire AI</button>
        <div className="hidden gap-7 text-sm text-slate-400 sm:flex">
          <button onClick={() => go('landing')} className="hover:text-white">Home</button><button onClick={() => go('roles')} className="hover:text-white">Interview</button>
          <button onClick={() => { go('landing'); setTimeout(() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' }), 50) }} className="hover:text-white">How It Works</button>
          <button onClick={() => { go('landing'); setTimeout(() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }), 50) }} className="hover:text-white">About</button>
        </div>
        {cta && <button onClick={() => go('roles')} className={`${primary} !py-2`}>Start Interview</button>}
      </nav>
    </header>
  )
}

function Landing({ go }: { go: (v: View) => void }) {
  return (
    <main className="fade">
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 md:grid-cols-2 md:py-24">
        <div>
          <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">Meet Your <span className="bg-gradient-to-r from-indigo-300 to-violet-400 bg-clip-text text-transparent">AI Interviewer.</span></h1>
          <p className="mt-5 max-w-md text-lg text-slate-400">Practice realistic technical interviews, receive intelligent feedback, and discover where you stand.</p>
          <div className="mt-8 flex flex-wrap gap-3"><button className={primary} onClick={() => go('roles')}>Start Interview <ArrowRight size={16} /></button>
            <button className={ghost} onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>How It Works</button></div>
        </div>
        <div className="grid place-items-center"><Orb state="speaking" /></div>
      </section>
      <section id="how" className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="mb-6 text-2xl font-semibold">How It Works</h2>
        <div className="grid gap-4 sm:grid-cols-3">{[['Choose a role', 'Pick from 8 technical roles.'], ['Speak with the AI', 'Three spoken questions. Answer with your microphone.'], ['Get your report', 'Scores, feedback and a spoken result.']].map(([t, d], i) => (
          <div key={t} className={`${card} p-6`}><div className="text-sm text-indigo-300">0{i + 1}</div><div className="mt-2 font-medium">{t}</div><p className="mt-1 text-sm text-slate-400">{d}</p></div>))}</div>
      </section>
      <section id="about" className="mx-auto max-w-6xl px-5 pb-20 text-sm text-slate-500">VoxHire AI is a prototype candidate-screening system built for an academic Deep Learning project. Results are not an actual employment decision.</section>
    </main>
  )
}

function Roles({ role, setRole, go }: { role: Role | null; setRole: (r: Role) => void; go: (v: View) => void }) {
  return (
    <main className="fade mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">Choose Your Interview</h1><p className="mt-2 text-slate-400">Select the role you're preparing for.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup" aria-label="Job roles">
        {ROLES.map(r => { const I = ICONS[r.id], sel = role?.id === r.id; return (
          <button key={r.id} role="radio" aria-checked={sel} onClick={() => setRole(r)} className={`${card} p-5 text-left transition hover:-translate-y-1 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${sel ? '!border-indigo-400 shadow-[0_0_35px_-8px_rgba(99,102,241,.7)]' : ''}`}>
            <I size={22} className="text-indigo-300" /><div className="mt-4 font-medium">{r.title}</div><p className="mt-1 text-sm text-slate-400">{r.desc}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">{r.skills.map(s => <span key={s} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300">{s}</span>)}</div>
          </button>) })}
      </div>
      <div className="mt-10 flex justify-between"><button className={ghost} onClick={() => go('landing')}><ArrowLeft size={16} />Back</button><button className={primary} disabled={!role} onClick={() => go('setup')}>Continue <ArrowRight size={16} /></button></div>
    </main>
  )
}

function Setup({ role, go }: { role: Role; go: (v: View) => void }) {
  const [err, setErr] = useState('')
  const enter = async () => {
    if (stt.isSupported() && navigator.mediaDevices?.getUserMedia) {
      try { (await navigator.mediaDevices.getUserMedia({ audio: true })).getTracks().forEach(t => t.stop()) }
      catch { setErr('Microphone access was blocked. Allow it in your browser address bar, or continue and type your answers.') ; return }
    }
    go('room')
  }
  return (
    <main className="fade mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">Interview Setup</h1>
      <div className={`${card} mt-8 divide-y divide-white/5`}>{[['Role', role.title], ['Duration', '5–7 minutes'], ['Questions', '3'], ['Type', 'Technical + Problem Solving + Behavioral']].map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 p-4 text-sm"><span className="text-slate-400">{k}</span><span className="text-right">{v}</span></div>))}</div>
      <div className={`${card} mt-4 flex gap-3 p-4 text-sm text-slate-400`}><Mic size={18} className="mt-0.5 shrink-0 text-indigo-300" />Your microphone will be used only during the interview. Turn your volume up — the interviewer speaks aloud. Best in Chrome or Edge.</div>
      {!stt.isSupported() && <p className="mt-3 flex gap-2 text-sm text-amber-300"><AlertTriangle size={16} />Speech recognition isn't supported in this browser; you can type answers instead.</p>}
      {err && <p className="mt-3 text-sm text-amber-300" role="alert">{err}</p>}
      <div className="mt-8 flex justify-between"><button className={ghost} onClick={() => go('roles')}><ArrowLeft size={16} />Back</button><button className={primary} onClick={enter}>Enter Interview Room</button></div>
    </main>
  )
}

function Room({ role, onDone, exit }: { role: Role; onDone: (r: Result[]) => void; exit: () => void }) {
  const qs = useRef(buildQuestions(role)).current
  const [i, setI] = useState(0), [phase, setPhase] = useState<Phase>('speaking'), [text, setText] = useState(''), [msg, setMsg] = useState(''), [fb, setFb] = useState(''), [sec, setSec] = useState(0)
  const phaseRef = useRef<Phase>('speaking'), textRef = useRef(''), run = useRef(0), results = useRef<Result[]>([]), iRef = useRef(0)
  const setP = (p: Phase) => { phaseRef.current = p; setPhase(p) }
  const supported = stt.isSupported()

  const ask = async (idx: number, pre?: string) => {
    const t = ++run.current; iRef.current = idx; setI(idx); setP('speaking'); setText(''); textRef.current = ''; setMsg(''); setFb('')
    if (pre) { await tts.speak(pre); if (t !== run.current) return }
    await tts.speak(qs[idx].text); if (t !== run.current) return
    setP('idle')
  }
  useEffect(() => { ask(0, intro(role)); return () => { run.current++; tts.cancel(); stt.abort() } }, []) // eslint-disable-line
  useEffect(() => { const id = setInterval(() => setSec(s => s + 1), 1000); return () => clearInterval(id) }, [])

  const finish = async (override?: string) => {
    if (override === undefined && phaseRef.current !== 'listening') return
    const ans = (override ?? textRef.current).trim(), idx = iRef.current
    if (ans.split(/\s+/).filter(Boolean).length < 3) { setP('idle'); setMsg("I didn't catch enough of that. Please try again."); return }
    setText(ans); setP('processing')
    const t = ++run.current
    const [ev] = await Promise.all([evaluateAnswer(ans, role.id, qs[idx].type), sleep(1500)])
    if (t !== run.current) return
    results.current.push({ ...ev, question: qs[idx].text, answer: ans })
    setP('feedback'); setFb(ev.spoken)
    await tts.speak(ev.spoken); if (t !== run.current) return
    if (idx === 2) { await tts.speak('That completes the interview. Let me prepare your results.'); if (t === run.current) onDone(results.current) }
    else ask(idx + 1, transition(idx + 1))
  }
  const mic = () => {
    if (phase === 'listening') { stt.stop(); return }
    if (phase !== 'idle' && phase !== 'speaking') return
    run.current++; tts.cancel(); setMsg(''); setText(''); textRef.current = ''
    const ok = stt.start({
      onText: t => { textRef.current = t; setText(t) },
      onEnd: () => finish(),
      onError: e => { setP('idle'); setMsg(e === 'not-allowed' ? 'Microphone permission denied. Allow it in your browser settings.' : e === 'no-speech' ? "I didn't hear anything. Click the mic and try again." : e === 'aborted' ? '' : `Speech recognition error (${e}). Try again or type your answer.`) },
    })
    if (ok) setP('listening'); else setMsg('Could not start the microphone. You can type your answer below.')
  }
  const repeat = () => { stt.abort(); ask(iRef.current) }
  const status = { speaking: 'AI is speaking…', idle: 'Click to answer', listening: 'Listening…', processing: 'Analyzing your response…', feedback: fb }[phase]
  const mm = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

  return (
    <main className="fade flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,#14183a,#05070f_60%)]">
      <div className="border-b border-white/5 px-5 py-4"><div className="mx-auto flex max-w-4xl items-center justify-between text-sm">
        <span className="font-semibold tracking-wide">VOXHIRE AI</span><span className="text-slate-300">Question {i + 1} / 3</span><span className="tabular-nums text-slate-400">{mm}</span></div>
        <div className="mx-auto mt-3 h-1 max-w-4xl overflow-hidden rounded bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={3} aria-valuenow={i}><div className="h-full bg-indigo-400 transition-all duration-700" style={{ width: `${((i + (phase === 'feedback' ? 1 : 0)) / 3) * 100}%` }} /></div></div>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-5 py-6 text-center">
        <Orb state={phase} /><div className="-mt-4 text-xs uppercase tracking-[0.2em] text-indigo-300">AI Interviewer</div>
        <h1 className="mt-4 text-2xl font-medium leading-snug sm:text-3xl">{qs[i].text}</h1>
        <p className="mt-4 text-sm text-slate-400" aria-live="polite">{status}</p>
        <div className="mt-4"><Wave on={phase === 'listening' || phase === 'processing'} /></div>
        <div className="relative mt-4">
          {phase === 'listening' && <span className="absolute inset-0 rounded-full bg-red-500/40" style={{ animation: 'ring 1.4s ease-out infinite' }} />}
          <button onClick={mic} disabled={phase === 'processing' || phase === 'feedback'} aria-label={phase === 'listening' ? 'Stop recording' : 'Start answering with microphone'}
            className={`relative grid h-20 w-20 place-items-center rounded-full text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:opacity-40 ${phase === 'listening' ? 'bg-red-500' : 'bg-indigo-500 shadow-[0_0_40px_-5px_rgba(99,102,241,.8)] hover:bg-indigo-400'}`}>
            {phase === 'listening' ? <Square size={26} /> : <Mic size={28} />}</button></div>
        {msg && <p className="mt-3 text-sm text-amber-300" role="alert">{msg}</p>}
        <div className={`${card} mt-5 min-h-[88px] w-full p-4 text-left text-sm`} aria-live="polite">
          <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">Your answer</div>
          {text ? <p className="text-slate-200">{text}</p> : <p className="text-slate-500">Your answer will appear here as you speak…</p>}</div>
        {(!supported || msg) && phase === 'idle' && <form className="mt-3 flex w-full gap-2" onSubmit={e => { e.preventDefault(); const v = new FormData(e.currentTarget).get('t') as string; if (v) finish(v) }}>
          <input name="t" aria-label="Type your answer" placeholder="Type your answer instead…" className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-indigo-400" /><button className={primary}>Submit</button></form>}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {phase === 'listening' && <button className={primary} onClick={() => stt.stop()}><Check size={16} />Finish Answer</button>}
          <button className={ghost} onClick={repeat} disabled={phase === 'processing' || phase === 'feedback'}><Volume2 size={16} />Repeat Question</button>
          <button className={ghost} onClick={exit}><RotateCcw size={16} />Restart</button></div>
      </div>
    </main>
  )
}

function Bar({ label, v }: { label: string; v: number }) {
  const [w, setW] = useState(0); useEffect(() => { const t = setTimeout(() => setW(v), 150); return () => clearTimeout(t) }, [v])
  return <div><div className="mb-1 flex justify-between text-sm"><span className="text-slate-300">{label}</span><span>{v}%</span></div><div className="h-2 rounded bg-white/10"><div className="h-2 rounded bg-gradient-to-r from-indigo-500 to-violet-400 transition-all duration-1000" style={{ width: `${w}%` }} /></div></div>
}
function Results({ role, list, restart, go }: { role: Role; list: Result[]; restart: () => void; go: (v: View) => void }) {
  const s = summarize(list), [open, setOpen] = useState(0), [n, setN] = useState(0)
  const speech = finalSpeech(s.decision, s.overall)
  useEffect(() => { tts.speak(speech); return () => tts.cancel() }, []) // eslint-disable-line
  useEffect(() => { let c = 0; const id = setInterval(() => { c += 2; setN(Math.min(c, s.overall)); if (c >= s.overall) clearInterval(id) }, 20); return () => clearInterval(id) }, [s.overall])
  const col = s.decision === 'SELECTED' ? 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10' : s.decision === 'NOT SELECTED' ? 'text-rose-300 border-rose-400/40 bg-rose-400/10' : 'text-amber-300 border-amber-400/40 bg-amber-400/10'
  const good = ['Technical Knowledge', 'Problem Solving', 'Communication', 'Confidence / Clarity']
  const vals = [s.technical, s.problemSolving, s.communication, s.clarity]
  const rec = s.decision === 'SELECTED' ? 'Your performance shows strong potential for this role. Keep giving structured technical explanations.' : s.decision === 'FURTHER REVIEW' ? 'Promising performance. Add technical depth and concrete examples to strengthen your answers.' : 'Focus on core concepts for the role and structure answers step by step, then try again.'
  return (
    <main className="fade mx-auto max-w-4xl px-5 py-12">
      <p className="text-sm text-slate-400">{role.title}</p><h1 className="text-4xl font-semibold tracking-tight">Interview Performance</h1>
      <div className={`${card} mt-8 flex flex-wrap items-center justify-between gap-6 p-8`}>
        <div><div className="text-7xl font-semibold tabular-nums">{n}<span className="text-2xl text-slate-500"> / 100</span></div></div>
        <span className={`rounded-full border px-5 py-2 text-sm font-semibold tracking-wider ${col}`}>{s.decision}</span></div>
      <div className={`${card} mt-4 grid gap-5 p-6 sm:grid-cols-2`}>{good.map((g, k) => <Bar key={g} label={g} v={vals[k]} />)}<Bar label="Overall" v={s.overall} /></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className={`${card} p-6`}><h2 className="mb-3 font-medium">What You Did Well</h2>{list.map((r, k) => <p key={k} className="mb-2 text-sm text-slate-300">✓ {r.strength}</p>)}</div>
        <div className={`${card} p-6`}><h2 className="mb-3 font-medium">Areas to Improve</h2>{list.map((r, k) => <p key={k} className="mb-2 text-sm text-slate-300">• {r.improvement}</p>)}</div></div>
      <div className={`${card} mt-4 p-6`}><h2 className="mb-2 font-medium">AI Recommendation</h2><p className="text-slate-300">{rec}</p></div>
      <h2 className="mb-3 mt-8 font-medium">Question-by-Question</h2>
      {list.map((r, k) => (<div key={k} className={`${card} mb-3`}>
        <button className="flex w-full items-center justify-between p-4 text-left" aria-expanded={open === k} onClick={() => setOpen(open === k ? -1 : k)}><span>Question {k + 1} <span className="ml-2 text-slate-400">{r.overall}/100</span></span><ChevronDown size={18} className={open === k ? 'rotate-180' : ''} /></button>
        {open === k && <div className="space-y-2 border-t border-white/5 p-4 text-sm"><p className="text-slate-400">{r.question}</p><p><span className="text-slate-500">Your answer: </span>{r.answer}</p><p className="text-emerald-300">Strength: {r.strength}</p><p className="text-amber-300">Improve: {r.improvement}</p></div>}</div>))}
      <p className="mt-4 text-xs text-slate-500">Prototype evaluation for an academic project — not an actual employment decision.</p>
      <div className="mt-6 flex flex-wrap gap-3"><button className={ghost} onClick={() => { tts.speak(speech) }}><Volume2 size={16} />Replay Voice Feedback</button><button className={primary} onClick={restart}><RotateCcw size={16} />Restart Interview</button><button className={ghost} onClick={() => go('roles')}>Choose another role</button></div>
    </main>
  )
}

export default function App() {
  const [view, setView] = useState<View>('landing'), [role, setRole] = useState<Role | null>(null), [res, setRes] = useState<Result[]>([]), [key, setKey] = useState(0)
  const go = (v: View) => { tts.cancel(); if ((v === 'setup' || v === 'room') && !role) v = 'roles'; setView(v); window.scrollTo(0, 0) }
  const restart = () => { setKey(k => k + 1); go('setup') }
  return (
    <div className="min-h-screen">
      {view !== 'room' && <Nav go={go} cta={view === 'landing'} />}
      {view === 'landing' && <Landing go={go} />}
      {view === 'roles' && <Roles role={role} setRole={setRole} go={go} />}
      {view === 'setup' && role && <Setup role={role} go={go} />}
      {view === 'room' && role && <Room key={key} role={role} onDone={r => { setRes(r); setView('results') }} exit={restart} />}
      {view === 'results' && role && <Results key={key} role={role} list={res} restart={restart} go={go} />}
    </div>
  )
}
