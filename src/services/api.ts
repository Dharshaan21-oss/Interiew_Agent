/** Thin client for the FastAPI backend (proxied at /api by Vite). Only a random session token is stored in the browser — never passwords. */
export interface User { id: number; name: string; email: string }
export interface HistoryRow { id: number; role_id: string; role_title: string; completed: string; overall: number; technical: number; problem: number; communication: number; clarity: number; decision: string; answered: number; skipped: number }
export const setToken = (t: string | null) => (t ? localStorage.setItem('vh_token', t) : localStorage.removeItem('vh_token'))
async function req(path: string, method = 'GET', body?: unknown) {
  const t = localStorage.getItem('vh_token')
  let r: Response
  try { r = await fetch('/api' + path, { method, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: body ? JSON.stringify(body) : undefined }) }
  catch { throw new Error('Cannot reach the server. Is the backend running on port 8000?') }
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(typeof j.detail === 'string' ? j.detail : 'Request failed')
  return j
}
export const api = {
  signup: (b: { name: string; email: string; password: string }) => req('/auth/signup', 'POST', b),
  signin: (b: { email: string; password: string }) => req('/auth/signin', 'POST', b),
  signout: () => req('/auth/signout', 'POST'),
  me: (): Promise<User> => req('/me'),
  start: (role_id: string): Promise<{ id: number; set_index: number }> => req('/interviews/start', 'POST', { role_id }),
  complete: (id: number, report: unknown) => req(`/interviews/${id}/complete`, 'POST', { report }),
  list: (): Promise<HistoryRow[]> => req('/interviews'),
  get: (id: number) => req(`/interviews/${id}`),
}
