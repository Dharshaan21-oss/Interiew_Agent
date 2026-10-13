import { ROLES, QuestionType } from './interviewService'

export interface AnswerEval {
  technical: number; problemSolving: number; communication: number; clarity: number
  overall: number; strength: string; improvement: string; spoken: string
}
export type Decision = 'SELECTED' | 'FURTHER REVIEW' | 'NOT SELECTED'

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
const count = (s: string, r: RegExp) => (s.match(r) || []).length

/**
 * MOCK EVALUATOR (heuristics on the real transcript).
 * DEEP LEARNING INTEGRATION POINT: replace the body of evaluateAnswer with
 *   - a call to your backend: POST /api/evaluate {answer, role, questionType} (BERT/DistilBERT
 *     classifier or LLM scoring), returning the same AnswerEval shape; or
 *   - in-browser inference with transformers.js.
 * Nothing else in the app needs to change.
 */
export async function evaluateAnswer(answer: string, roleId: string, type: QuestionType): Promise<AnswerEval> {
  const role = ROLES.find(r => r.id === roleId)!
  const a = answer.toLowerCase()
  const words = a.split(/\s+/).filter(Boolean).length
  const hits = role.concepts.filter(c => a.includes(c.toLowerCase())).length
  const coverage = Math.min(1, hits / Math.min(role.concepts.length, 4))
  const steps = count(a, /\b(first|then|next|after that|finally|identify|monitor|log|profil\w*|test\w*|root cause|measure|prioriti\w*|plan|because|communicate|deadline|break\w* down)\b/g)
  const fillers = count(a, /\b(um|uh|like|you know|basically|actually)\b/g)
  const sentences = Math.max(1, count(answer, /[.!?]+/g) || Math.ceil(words / 14))
  const avg = words / sentences
  const len = Math.min(words, 120) / 120

  const technical = clamp(15 + coverage * 55 + len * 30 - (type === 'technical' ? 0 : 5))
  const problemSolving = clamp(15 + Math.min(steps, 6) * 10 + coverage * 15 + len * 15)
  const communication = clamp(25 + len * 50 + (sentences >= 3 ? 15 : 0) - fillers * 4 + (words > 25 ? 10 : 0))
  const clarity = clamp(30 + Math.min(steps, 5) * 7 + (avg >= 8 && avg <= 28 ? 25 : 8) - fillers * 5 + len * 10)
  const overall = clamp(technical * 0.4 + problemSolving * 0.3 + communication * 0.2 + clarity * 0.1)

  const strength = coverage > 0.5 ? 'Good use of relevant technical concepts.' : steps >= 3 ? 'Clear, step-by-step reasoning.' : words > 40 ? 'Detailed, well-paced delivery.' : 'You attempted a direct answer.'
  const improvement = coverage < 0.5 ? `Mention key concepts such as ${role.concepts.slice(0, 3).join(', ')}.` : steps < 3 ? 'Structure your answer in clear steps.' : 'Add a concrete real-world example.'
  const spoken = overall >= 75 ? 'Good, that was a strong answer.' : overall >= 55 ? "Thank you. That's a reasonable answer." : "Thank you. I'd encourage more depth next time."
  return { technical, problemSolving, communication, clarity, overall, strength, improvement, spoken }
}

export interface ReportQ { text: string; category: string; status: 'answered' | 'skipped'; answer: string; scores: AnswerEval | null }
export interface Summary { technical: number; problemSolving: number; communication: number; clarity: number; overall: number; decision: Decision; answered: number; skipped: number }
export interface Report { role_id: string; role_title: string; candidate: string; setName: string; questions: ReportQ[]; summary: Summary; strengths: string[]; improvements: string[]; suggestions: string[]; id?: number; completed?: string }

/** Category scores average over ALL questions; a skipped question contributes 0 (it is never given a per-question score). */
export function summarizeQ(qs: ReportQ[]): Summary {
  const avg = (k: 'technical' | 'problemSolving' | 'communication' | 'clarity') => clamp(qs.reduce((s, q) => s + (q.scores ? q.scores[k] : 0), 0) / qs.length)
  const technical = avg('technical'), problemSolving = avg('problemSolving'), communication = avg('communication'), clarity = avg('clarity')
  const overall = clamp(technical * 0.4 + problemSolving * 0.3 + communication * 0.2 + clarity * 0.1)
  const decision: Decision = overall >= 80 ? 'SELECTED' : overall >= 65 ? 'FURTHER REVIEW' : 'NOT SELECTED'
  const answered = qs.filter(q => q.status === 'answered').length
  return { technical, problemSolving, communication, clarity, overall, decision, answered, skipped: qs.length - answered }
}
export function buildFeedback(qs: ReportQ[], d: Decision) {
  const a = qs.filter(q => q.scores)
  const uniq = (x: string[]) => [...new Set(x)]
  const suggestions = [d === 'SELECTED' ? 'Keep giving structured answers with a concrete example.' : 'Use a clear structure: concept, example, trade-off.', 'Mention the key terms for the role explicitly.']
  if (a.length < qs.length) suggestions.push('Try answering every question, even briefly — skipped questions score zero.')
  return { strengths: a.length ? uniq(a.map(q => q.scores!.strength)) : ['No answers were given, so no strengths could be identified.'], improvements: uniq(a.map(q => q.scores!.improvement)), suggestions }
}
