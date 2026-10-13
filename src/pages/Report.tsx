import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronDown, RotateCcw, Volume2, Loader2 } from 'lucide-react'
import { api } from '../services/api'
import { Report } from '../services/evaluationService'
import { finalSpeech } from '../services/interviewService'
import { textToSpeechService as tts } from '../services/textToSpeechService'
import { card, primary, ghost, decCol } from '../ui'

function Bar({ label, v }: { label: string; v: number }) {
  const [w, setW] = useState(0); useEffect(() => { const t = setTimeout(() => setW(v), 150); return () => clearTimeout(t) }, [v])
  return <div><div className="mb-1 flex justify-between text-sm"><span className="text-slate-300">{label}</span><span>{v}%</span></div><div className="h-2 rounded bg-white/10"><div className="h-2 rounded bg-gradient-to-r from-indigo-500 to-violet-400 transition-all duration-1000" style={{ width: `${w}%` }} /></div></div>
}
export const fmt = (d?: string) => (d ? new Date(d) : new Date()).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

export function ReportView({ report: r, speak, onBack, backLabel, onRestart, saveErr }: { report: Report; speak?: boolean; onBack: () => void; backLabel: string; onRestart?: () => void; saveErr?: string }) {
  const s = r.summary, [open, setOpen] = useState(0), [n, setN] = useState(0), text = finalSpeech(s.decision, s.overall)
  useEffect(() => { if (speak) tts.speak(text); return () => tts.cancel() }, []) // eslint-disable-line
  useEffect(() => { let c = 0; const id = setInterval(() => { c += 2; setN(Math.min(c, s.overall)); if (c >= s.overall) clearInterval(id) }, 20); return () => clearInterval(id) }, [s.overall])
  const summary = s.decision === 'SELECTED' ? 'Strong overall performance with relevant technical content and clear delivery.' : s.decision === 'FURTHER REVIEW' ? 'Promising performance with room to grow in depth, structure or completeness.' : 'This interview did not reach the screening threshold; focus on the improvement areas below.'
  return (
    <main className="fade mx-auto max-w-4xl px-5 py-10">
      <button className="mb-4 flex items-center gap-2 text-sm text-slate-400 hover:text-white" onClick={onBack}><ArrowLeft size={16} />{backLabel}</button>
      {saveErr && <p className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200" role="alert">{saveErr}</p>}
      <h1 className="text-4xl font-semibold tracking-tight">Interview Performance</h1>
      <div className={`${card} mt-6 grid gap-3 p-5 text-sm sm:grid-cols-3`}>
        {[['Candidate', r.candidate], ['Role', r.role_title], ['Date', fmt(r.completed)], ['Question set', r.setName], ['Questions', `${r.questions.length} total`], ['Answered / Skipped', `${s.answered} / ${s.skipped}`]].map(([k, v]) => <div key={k}><div className="text-xs text-slate-500">{k}</div><div>{v}</div></div>)}</div>
      <div className={`${card} mt-4 flex flex-wrap items-center justify-between gap-6 p-8`}>
        <div className="text-7xl font-semibold tabular-nums">{n}<span className="text-2xl text-slate-500"> / 100</span></div>
        <span className={`rounded-full border px-5 py-2 text-sm font-semibold tracking-wider ${decCol(s.decision)}`}>{s.decision}</span></div>
      <p className="mt-3 text-slate-300">{summary}</p>
      <div className={`${card} mt-4 grid gap-5 p-6 sm:grid-cols-2`}><Bar label="Technical Knowledge" v={s.technical} /><Bar label="Problem Solving" v={s.problemSolving} /><Bar label="Communication" v={s.communication} /><Bar label="Clarity" v={s.clarity} /></div>
      <h2 className="mb-3 mt-8 font-medium">Question-by-Question Analysis</h2>
      {r.questions.map((q, k) => (<div key={k} className={`${card} mb-3`}>
        <button className="flex w-full items-center justify-between gap-3 p-4 text-left" aria-expanded={open === k} onClick={() => setOpen(open === k ? -1 : k)}>
          <span>Question {k + 1} <span className="ml-2 text-xs text-slate-500">{q.category}</span></span>
          <span className="flex items-center gap-3 text-sm"><span className={q.scores ? 'text-slate-200' : 'text-amber-300'}>{q.scores ? `${q.scores.overall}/100` : 'Skipped'}</span><ChevronDown size={18} className={open === k ? 'rotate-180' : ''} /></span></button>
        {open === k && <div className="space-y-2 border-t border-white/5 p-4 text-sm"><p className="text-slate-400">{q.text}</p>
          {q.scores ? <><p><span className="text-slate-500">Your answer: </span>{q.answer}</p><p className="text-emerald-300">Strength: {q.scores.strength}</p><p className="text-amber-300">Improve: {q.scores.improvement}</p><p className="text-slate-400">Feedback: {q.scores.spoken}</p></>
            : <p className="text-amber-300">Skipped — not scored</p>}</div>}</div>))}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className={`${card} p-6`}><h2 className="mb-3 font-medium">What You Did Well</h2>{r.strengths.map((x, i) => <p key={i} className="mb-2 text-sm text-slate-300">✓ {x}</p>)}</div>
        <div className={`${card} p-6`}><h2 className="mb-3 font-medium">Areas to Improve</h2>{r.improvements.length ? r.improvements.map((x, i) => <p key={i} className="mb-2 text-sm text-slate-300">• {x}</p>) : <p className="text-sm text-slate-400">None identified.</p>}</div></div>
      <div className={`${card} mt-4 p-6`}><h2 className="mb-2 font-medium">Suggestions for Future Interviews</h2>{r.suggestions.map((x, i) => <p key={i} className="mb-1 text-sm text-slate-300">→ {x}</p>)}</div>
      <p className="mt-4 text-xs text-slate-500">Prototype evaluation using a rule-based mock scorer for an academic project — not an actual employment decision.</p>
      <div className="mt-6 flex flex-wrap gap-3"><button className={ghost} onClick={() => tts.speak(text)}><Volume2 size={16} />Play Voice Feedback</button>
        {onRestart && <button className={primary} onClick={onRestart}><RotateCcw size={16} />New Interview</button>}</div>
    </main>)
}
export function ReportPage({ id, onBack }: { id: number; onBack: () => void }) {
  const [r, setR] = useState<Report | null>(null), [err, setErr] = useState('')
  useEffect(() => { api.get(id).then(setR).catch(e => setErr(e.message)) }, [id])
  if (err) return <main className="mx-auto max-w-md px-5 py-20 text-center"><p className="text-rose-300">{err}</p><button className={`${ghost} mt-4`} onClick={onBack}>Back to Interview History</button></main>
  if (!r) return <div className="grid place-items-center py-32"><Loader2 className="animate-spin text-indigo-300" /></div>
  return <ReportView report={r} onBack={onBack} backLabel="Back to Interview History" />
}
