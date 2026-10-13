# VoxHire AI — AI Voice Interview Agent

React + TypeScript + Vite + Tailwind frontend, FastAPI + SQLite backend (local).

## Setup (one time)
```bash
# Terminal 1 — backend
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows   (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
python seed.py                  # creates the 5 DEV demo accounts (safe to re-run)
uvicorn main:app --port 8000

# Terminal 2 — frontend (project root)
npm install
npm run dev                     # open http://localhost:5173 in Chrome or Edge
```
The database file `backend/voxhire.db` is created automatically and persists across restarts.

## Development accounts (password for all: `VoxHire@2026`)
candidate1@voxhire.local … candidate5@voxhire.local
Created only by `python seed.py` (no seed endpoint, nothing shown in the UI). Passwords are stored as salted PBKDF2 hashes.
New users: use **Sign in → Sign up**.

## Tests
`cd backend && python test_api.py` — 18 checks (auth, duplicates, isolation, history, randomization).

## How it works
- **Sets:** every role has 5 question sets (3 questions each: technical, problem solving, behavioral) in `src/services/interviewService.ts`.
- **Randomization:** `POST /api/interviews/start` picks a random set on the server (never the same set as the user's previous interview for that role) and stores it; the room builds the questions from that fixed set.
- **Skip:** "Skip Question" records the question as `skipped` with no answer and no score, speaks a short transition, and moves on; skipping Q3 goes to the report. Skipped questions count as 0 in category/overall averages.
- **Storage:** on completion the full report (questions, transcripts, statuses, per-question evaluations, scores, feedback) is saved as JSON on the user's interview row. History/report pages read the saved data and never re-evaluate. Every query filters by the signed-in user's id; another user's report returns 404.
- **Evaluation** is a rule-based mock in `src/services/evaluationService.ts` (not a trained model).

## Limits
Voice recognition needs Chrome/Edge/Safari and localhost or HTTPS. The Render static deploy only hosts the frontend; accounts need the backend running (local use).
