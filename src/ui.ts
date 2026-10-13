export const card = 'rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur'
export const btn = 'inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400'
export const primary = `${btn} bg-indigo-500 text-white hover:bg-indigo-400 shadow-[0_0_30px_-5px_rgba(99,102,241,.6)] disabled:opacity-40`
export const ghost = `${btn} border border-white/15 text-slate-200 hover:bg-white/5 disabled:opacity-40`
export const input = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-indigo-400'
export const decCol = (d: string) => d === 'SELECTED' ? 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10' : d === 'NOT SELECTED' ? 'text-rose-300 border-rose-400/40 bg-rose-400/10' : 'text-amber-300 border-amber-400/40 bg-amber-400/10'
