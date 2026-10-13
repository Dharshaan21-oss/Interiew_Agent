import type { Decision } from './evaluationService'
export type QuestionType = 'technical' | 'problem' | 'behavioral'
export interface Role { id: string; title: string; desc: string; skills: string[]; concepts: string[]; q1: string; q2: string }
export interface Question { text: string; type: QuestionType }

export const ROLES: Role[] = [
  { id: 'java', title: 'Java Developer', desc: 'Build robust backend systems on the JVM.', skills: ['Java', 'OOP', 'Collections', 'Backend'],
    concepts: ['OOP', 'inheritance', 'polymorphism', 'encapsulation', 'abstraction', 'Java', 'exception handling', 'collections'],
    q1: 'Can you explain the key principles of object-oriented programming and how they are used in Java?', q2: 'Your Java service suddenly becomes slow in production. How would you identify the cause and fix it?' },
  { id: 'python', title: 'Python Developer', desc: 'Write clean, productive Python for real products.', skills: ['Python', 'Functions', 'Modules', 'Testing'],
    concepts: ['Python', 'functions', 'classes', 'data structures', 'exception handling', 'modules'],
    q1: 'What are some important features of Python that make it useful for software development?', q2: 'A Python script that processes large files has become very slow. How would you find and fix the bottleneck?' },
  { id: 'ds', title: 'Data Scientist', desc: 'Turn data into models and decisions.', skills: ['Statistics', 'ML', 'Python', 'Features'],
    concepts: ['statistics', 'machine learning', 'data preprocessing', 'feature engineering', 'model evaluation', 'Python'],
    q1: 'Can you explain the difference between supervised and unsupervised learning?', q2: 'Your model performs well in testing but poorly on real data. How would you investigate?' },
  { id: 'mle', title: 'Machine Learning Engineer', desc: 'Train, ship and maintain ML systems.', skills: ['Training', 'MLOps', 'Optimization', 'Deployment'],
    concepts: ['training', 'validation', 'overfitting', 'optimization', 'deployment', 'machine learning'],
    q1: 'Can you explain what overfitting is and how you would prevent it?', q2: 'A deployed model slowly loses accuracy over time. How would you diagnose and handle it?' },
  { id: 'ai', title: 'AI Engineer', desc: 'Build applications on deep learning and LLMs.', skills: ['Deep Learning', 'Transformers', 'NLP', 'LLMs'],
    concepts: ['neural networks', 'deep learning', 'machine learning', 'transformers', 'AI'],
    q1: 'Can you explain how neural networks learn, and what makes transformers different?', q2: 'Your AI feature gives inconsistent answers in production. How would you make it reliable?' },
  { id: 'web', title: 'Web Developer', desc: 'Craft fast, accessible web experiences.', skills: ['HTML', 'CSS', 'JavaScript', 'APIs'],
    concepts: ['HTML', 'CSS', 'JavaScript', 'frontend', 'backend', 'API'],
    q1: 'Can you explain how HTML, CSS and JavaScript work together to build a web page?', q2: 'Your website has become slow to load. How would you find and fix the problem?' },
  { id: 'da', title: 'Data Analyst', desc: 'Find insights and tell the story in data.', skills: ['SQL', 'Excel', 'Visualization', 'Statistics'],
    concepts: ['SQL', 'statistics', 'data cleaning', 'visualization', 'Excel', 'Python'],
    q1: 'How do you clean and prepare a messy dataset before analysis?', q2: 'A key business metric suddenly dropped by twenty percent. How would you find out why?' },
  { id: 'se', title: 'Software Engineer', desc: 'Design and deliver reliable software.', skills: ['Algorithms', 'Design', 'Testing', 'Git'],
    concepts: ['algorithms', 'data structures', 'software design', 'testing', 'debugging', 'version control'],
    q1: 'What principles do you follow to write maintainable, well-designed software?', q2: 'Your application suddenly becomes slow in production. How would you systematically identify and solve the issue?' },
]

export const CAT: Record<QuestionType, string> = { technical: 'Technical Understanding', problem: 'Problem Solving', behavioral: 'Situational / Behavioral' }
export const SET_COUNT = 5
// Sets 2–5 per role: different concepts (technical) and different scenarios (problem solving). Set 1 = the original questions.
const TOPICS: Record<string, string[]> = {
  java: ['garbage collection and memory management', 'the Java Collections framework (List, Set, Map)', 'multithreading and synchronization', 'exception handling and try-with-resources'],
  python: ['decorators and generators', 'lists, tuples, dictionaries and sets', 'the GIL and concurrency', 'virtual environments and packaging'],
  ds: ['the bias–variance trade-off', 'handling missing data and outliers', 'precision, recall and the F1 score', 'cross-validation'],
  mle: ['gradient descent and the learning rate', 'batch versus online inference', 'data and model versioning', 'model monitoring in production'],
  ai: ['attention in transformers', 'fine-tuning versus prompt engineering', 'embeddings and vector search', 'evaluating generative models'],
  web: ['the browser rendering pipeline', 'REST versus GraphQL', 'authentication with sessions and tokens', 'responsive and accessible design'],
  da: ['SQL joins and aggregations', 'choosing the right chart for a message', 'A/B testing and statistical significance', 'data quality checks'],
  se: ['the SOLID principles', 'unit versus integration testing', 'branching strategies and code review', 'time and space complexity'],
}
const SCEN: Record<string, string[]> = {
  java: ['a Java application is consuming too much memory', 'two threads intermittently corrupt shared data', 'an API endpoint takes ten seconds under load', 'a NullPointerException appears in production for only some users'],
  python: ['a script runs out of memory on a very large CSV file', 'a web API returns wrong results only occasionally', 'a dependency upgrade breaks your application', 'a nightly job silently stops running'],
  ds: ['your classes are heavily imbalanced', 'model accuracy is high but the business impact is poor', 'stakeholders do not trust your model', 'you discover your features leak future information'],
  mle: ['training is too slow on a large dataset', 'inference latency exceeds your target', 'production data differs from training data', 'a new model version performs worse in production'],
  ai: ['a chatbot confidently states false facts', 'retrieval returns irrelevant documents', 'model inference costs are far too high', 'users report biased outputs'],
  web: ['a page layout breaks on mobile devices', 'a user reports a cross-site scripting vulnerability', 'an API call fails intermittently in production', 'a page scores poorly on Lighthouse performance'],
  da: ['two reports show different revenue numbers', 'a dashboard query is very slow', 'a stakeholder challenges your conclusion', 'a data source changes its format overnight'],
  se: ['a release introduces a critical bug', 'you inherit a legacy codebase with no tests', 'a service crashes under heavy load', 'two services disagree about the same data'],
}
const BEHAV = ['Imagine you are given a difficult task with a very short deadline. How would you approach the situation?',
  'Tell me about a time you made a mistake in a project. How did you handle it and what did you learn?',
  'Imagine you disagree with a teammate about the best way to implement a feature. How would you handle the disagreement?',
  'You are asked to learn an unfamiliar technology in one week. How would you go about it?',
  'Several urgent tasks arrive at the same time. How do you decide what to do first?']
export const setName = (r: Role, n: number) => `${r.id.toUpperCase()}-SET-${n + 1}`
export function buildQuestions(r: Role, set = 0): Question[] {
  const n = ((set % SET_COUNT) + SET_COUNT) % SET_COUNT
  return [
    { text: n === 0 ? r.q1 : `Can you explain ${TOPICS[r.id][n - 1]}, and how it applies in ${r.title} work?`, type: 'technical' },
    { text: n === 0 ? r.q2 : `Imagine ${SCEN[r.id][n - 1]}. How would you investigate and resolve it?`, type: 'problem' },
    { text: BEHAV[n], type: 'behavioral' },
  ]
}
export const intro = (r: Role) =>
  `Hello, and welcome to VoxHire. I'm your AI interviewer for the ${r.title} role. There are three questions. Take a moment to think before answering, and click the microphone when you're ready. Let's begin.`
export const transition = (next: number) => next === 1 ? "Let's move to the next question." : "Good. Here is the final question."
export function finalSpeech(d: Decision, score: number) {
  if (d === 'SELECTED') return `Thank you for completing the interview. Your overall performance was strong, with a score of ${score} out of 100. Based on this prototype evaluation, you have been selected to proceed to the next stage. Good luck.`
  if (d === 'NOT SELECTED') return `Thank you for completing the interview. Your overall score was ${score} out of 100. Based on this prototype evaluation, you have not been selected at this stage. Use the feedback to strengthen your skills and try again.`
  return `Thank you for completing the interview. Your performance was promising, but some areas need improvement. Your profile has been marked for further review.`
}
