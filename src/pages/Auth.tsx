import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { api, setToken, User } from '../services/api'
import { card, primary, input } from '../ui'

export default function Auth({ mode, onAuth, switchMode }: { mode: 'signin' | 'signup'; onAuth: (u: User) => void; switchMode: () => void }) {
  const up = mode === 'signup'
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '' }), [show, setShow] = useState(false)
  const [errs, setErrs] = useState<Record<string, string>>({}), [msg, setMsg] = useState(''), [ok, setOk] = useState(''), [busy, setBusy] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  const validate = () => {
    const e: Record<string, string> = {}
    if (up && !f.name.trim()) e.name = 'Full name is required.'
    if (!f.email.trim()) e.email = 'Email is required.'; else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) e.email = 'Enter a valid email address.'
    if (!f.password) e.password = 'Password is required.'
    else if (up && (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password))) e.password = 'At least 8 characters, with a letter and a number.'
    if (up && f.confirm !== f.password) e.confirm = 'Passwords do not match.'
    setErrs(e); return !Object.keys(e).length
  }
  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault(); setMsg(''); setOk('')
    if (!validate()) return
    setBusy(true)
    try {
      const r = up ? await api.signup({ name: f.name, email: f.email, password: f.password }) : await api.signin({ email: f.email, password: f.password })
      setToken(r.token); setOk(up ? 'Account created. Redirecting…' : 'Signed in. Redirecting…'); setTimeout(() => onAuth(r.user), 500)
    } catch (e) { setMsg((e as Error).message); setBusy(false) }
  }
  const Field = ({ k, label, type = 'text', auto }: { k: keyof typeof f; label: string; type?: string; auto: string }) => (
    <div><label htmlFor={k} className="mb-1.5 block text-sm text-slate-300">{label}</label>
      <div className="relative"><input id={k} name={k} type={type === 'password' && show ? 'text' : type} autoComplete={auto} value={f[k]} onChange={set(k)} className={`${input} ${errs[k] ? '!border-rose-400/60' : ''}`} aria-invalid={!!errs[k]} />
        {type === 'password' && k === 'password' && <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>}</div>
      {errs[k] && <p className="mt-1 text-xs text-rose-300" role="alert">{errs[k]}</p>}</div>)
  return (
    <main className="fade mx-auto grid max-w-md px-5 py-14">
      <div className={`${card} p-8`}>
        <h1 className="text-3xl font-semibold tracking-tight">{up ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-1 text-sm text-slate-400">{up ? 'Save your interviews and track your progress.' : 'Sign in to continue to VoxHire AI.'}</p>
        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          {up && Field({ k: 'name', label: 'Full name', auto: 'name' })}
          {Field({ k: 'email', label: 'Email address', type: 'email', auto: 'email' })}
          {Field({ k: 'password', label: 'Password', type: 'password', auto: up ? 'new-password' : 'current-password' })}
          {up && Field({ k: 'confirm', label: 'Confirm password', type: 'password', auto: 'new-password' })}
          {msg && <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200" role="alert">{msg}</p>}
          {ok && <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200" role="status">{ok}</p>}
          <button className={`${primary} w-full justify-center`} disabled={busy}>{busy && <Loader2 size={16} className="animate-spin" />}{up ? 'Sign Up' : 'Sign In'}</button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-400">{up ? 'Already have an account?' : "Don't have an account?"} <button onClick={switchMode} className="text-indigo-300 hover:underline">{up ? 'Sign in' : 'Sign up'}</button></p>
      </div></main>)
}
