import { useEffect, useMemo, useState } from 'react'
import { Loader2, Mic } from 'lucide-react'
import { api, HistoryRow, User } from '../services/api'
import { ROLES } from '../services/interviewService'
import { fmt } from './Report'
import { card, primary, ghost, decCol, input } from '../ui'

export default function Dashboard({ user, start, open }: { user: User; start: () => void; open: (id: number) => void }) {
  const [rows, setRows] = useState<HistoryRow[] | null>(null), [err, setErr] = useState(''), [role, setRole] = useState(''), [dec, setDec] = useState('')
  useEffect(() => { api.list().then(setRows).catch(e => setErr(e.message)) }, [])
  const st = useMemo(() => { const r = rows || []; const c = (d: string) => r.filter(x => x.decision === d).length
    return [['Completed', r.length], ['Average score', r.length ? Math.round(r.reduce((s, x) => s + x.overall, 0) / r.length) : '—'], ['Highest score', r.length ? Math.max(...r.map(x => x.overall)) : '—'],
      ['Selected', c('SELECTED')], ['Further review', c('FURTHER REVIEW')], ['Not selected', c('NOT SELECTED')]] }, [rows])
  const shown = (rows || []).filter(x => (!role || x.role_id === role) && (!dec || x.decision === dec))
  return (
    <main className="fade mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-slate-400">{user.email}</p><h1 className="text-4xl font-semibold tracking-tight">Welcome, {user.name.split(' ')[0]}</h1></div>
        <button className={primary} onClick={start}>Start Interview</button></div>
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-6">{st.map(([k, v]) => <div key={k as string} className={`${card} p-4`}><div className="text-2xl font-semibold tabular-nums">{v}</div><div className="mt-1 text-xs text-slate-400">{k}</div></div>)}</div>
      <h2 className="mb-3 mt-10 text-xl font-medium">Interview History</h2>
      {err && <p className="text-rose-300" role="alert">{err}</p>}
      {!rows && !err && <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-indigo-300" /></div>}
      {rows && rows.length === 0 && <div className={`${card} grid place-items-center gap-3 p-12 text-center`}><Mic className="text-indigo-300" /><p className="text-lg">No interviews yet</p><p className="max-w-sm text-sm text-slate-400">Your completed interviews and reports will appear here.</p><button className={primary} onClick={start}>Start Your First Interview</button></div>}
      {rows && rows.length > 0 && <>
        <div className="mb-3 flex flex-wrap gap-3"><select aria-label="Filter by role" className={`${input} !w-auto`} value={role} onChange={e => setRole(e.target.value)}><option value="">All roles</option>{ROLES.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}</select>
          <select aria-label="Filter by result" className={`${input} !w-auto`} value={dec} onChange={e => setDec(e.target.value)}><option value="">All results</option><option>SELECTED</option><option>FURTHER REVIEW</option><option>NOT SELECTED</option></select></div>
        <div className={`${card} overflow-x-auto`}><table className="w-full min-w-[820px] text-left text-sm"><thead className="text-xs uppercase tracking-wider text-slate-500"><tr>{['Role', 'Date', 'Score', 'Tech', 'Problem', 'Comm.', 'Clarity', 'Result', 'Ans / Skip', ''].map(h => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{shown.map(x => <tr key={x.id} className="border-t border-white/5 hover:bg-white/[0.03]"><td className="p-3">{x.role_title}</td><td className="p-3 text-slate-400">{fmt(x.completed)}</td><td className="p-3 font-semibold">{x.overall}</td><td className="p-3">{x.technical}</td><td className="p-3">{x.problem}</td><td className="p-3">{x.communication}</td><td className="p-3">{x.clarity}</td>
            <td className="p-3"><span className={`rounded-full border px-2.5 py-1 text-xs ${decCol(x.decision)}`}>{x.decision}</span></td><td className="p-3">{x.answered} / {x.skipped}</td><td className="p-3"><button className={`${ghost} !px-4 !py-1.5`} onClick={() => open(x.id)}>View Full Report</button></td></tr>)}</tbody></table>
          {!shown.length && <p className="p-6 text-center text-sm text-slate-400">No interviews match these filters.</p>}</div></>}
    </main>)
}
