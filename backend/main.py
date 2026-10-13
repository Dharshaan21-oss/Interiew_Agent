"""VoxHire API: FastAPI + SQLite. Passwords: salted PBKDF2-SHA256. Auth: random server-side session tokens."""
import hashlib, hmac, json, os, random, re, secrets, sqlite3
from datetime import datetime, timezone
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

DB = os.environ.get("VOXHIRE_DB", os.path.join(os.path.dirname(os.path.abspath(__file__)), "voxhire.db"))
ROLES = {"java": "Java Developer", "python": "Python Developer", "ds": "Data Scientist", "mle": "Machine Learning Engineer",
         "ai": "AI Engineer", "web": "Web Developer", "da": "Data Analyst", "se": "Software Engineer"}
SETS = 5  # question sets per role (the question text lives in src/services/interviewService.ts)
app = FastAPI(title="VoxHire API")

def db():
    c = sqlite3.connect(DB); c.row_factory = sqlite3.Row; return c
def now(): return datetime.now(timezone.utc).isoformat()
def init():
    with db() as c:
        c.executescript("""
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, salt BLOB, pw_hash BLOB, created TEXT);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER, created TEXT);
CREATE TABLE IF NOT EXISTS interviews(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, role_id TEXT, role_title TEXT, set_index INTEGER,
 status TEXT, started TEXT, completed TEXT, overall INTEGER, technical INTEGER, problem INTEGER, communication INTEGER, clarity INTEGER,
 decision TEXT, answered INTEGER, skipped INTEGER, report TEXT);""")
init()

def hp(pw: str, salt: bytes) -> bytes: return hashlib.pbkdf2_hmac("sha256", pw.encode(), salt, 200_000)
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
def check_pw(pw: str):
    if len(pw) < 8 or not re.search(r"[A-Za-z]", pw) or not re.search(r"\d", pw):
        raise HTTPException(400, "Password must be at least 8 characters and include a letter and a number.")
def create_user(name: str, email: str, pw: str) -> int:
    name, email = name.strip(), email.strip().lower()
    if not name: raise HTTPException(400, "Full name is required.")
    if not EMAIL.match(email): raise HTTPException(400, "Enter a valid email address.")
    check_pw(pw)
    salt = os.urandom(16)
    with db() as c:
        try: return c.execute("INSERT INTO users(name,email,salt,pw_hash,created) VALUES(?,?,?,?,?)", (name, email, salt, hp(pw, salt), now())).lastrowid
        except sqlite3.IntegrityError: raise HTTPException(409, "An account with this email already exists.")
def new_session(uid: int) -> str:
    t = secrets.token_urlsafe(32)
    with db() as c: c.execute("INSERT INTO sessions VALUES(?,?,?)", (t, uid, now()))
    return t
def current(authorization: str | None):
    tok = (authorization or "").removeprefix("Bearer ").strip()
    with db() as c:
        r = c.execute("SELECT u.id,u.name,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?", (tok,)).fetchone() if tok else None
    if not r: raise HTTPException(401, "Please sign in.")
    return dict(r)

class SignUp(BaseModel): name: str; email: str; password: str
class SignIn(BaseModel): email: str; password: str
class Start(BaseModel): role_id: str
class Complete(BaseModel): report: dict

@app.post("/api/auth/signup")
def signup(b: SignUp):
    uid = create_user(b.name, b.email, b.password)
    return {"token": new_session(uid), "user": {"id": uid, "name": b.name.strip(), "email": b.email.strip().lower()}}
@app.post("/api/auth/signin")
def signin(b: SignIn):
    with db() as c: r = c.execute("SELECT * FROM users WHERE email=?", (b.email.strip().lower(),)).fetchone()
    if not r or not hmac.compare_digest(r["pw_hash"], hp(b.password, r["salt"])):
        raise HTTPException(401, "Invalid email or password.")
    return {"token": new_session(r["id"]), "user": {"id": r["id"], "name": r["name"], "email": r["email"]}}
@app.post("/api/auth/signout")
def signout(authorization: str | None = Header(None)):
    tok = (authorization or "").removeprefix("Bearer ").strip()
    with db() as c: c.execute("DELETE FROM sessions WHERE token=?", (tok,))
    return {"ok": True}
@app.get("/api/me")
def me(authorization: str | None = Header(None)): return current(authorization)

@app.post("/api/interviews/start")
def start(b: Start, authorization: str | None = Header(None)):
    u = current(authorization)
    if b.role_id not in ROLES: raise HTTPException(400, "Unknown role.")
    with db() as c:
        last = c.execute("SELECT set_index FROM interviews WHERE user_id=? AND role_id=? ORDER BY id DESC LIMIT 1", (u["id"], b.role_id)).fetchone()
        choice = random.choice([i for i in range(SETS) if not last or i != last["set_index"]])  # no immediate repeat
        iid = c.execute("INSERT INTO interviews(user_id,role_id,role_title,set_index,status,started) VALUES(?,?,?,?,?,?)",
                        (u["id"], b.role_id, ROLES[b.role_id], choice, "in_progress", now())).lastrowid
    return {"id": iid, "set_index": choice}

@app.post("/api/interviews/{iid}/complete")
def complete(iid: int, b: Complete, authorization: str | None = Header(None)):
    u = current(authorization)
    with db() as c:
        r = c.execute("SELECT status FROM interviews WHERE id=? AND user_id=?", (iid, u["id"])).fetchone()
        if not r: raise HTTPException(404, "Interview not found.")
        if r["status"] == "completed": raise HTTPException(409, "Interview already saved.")
        s, qs = b.report.get("summary", {}), b.report.get("questions", [])
        if len(qs) != 3: raise HTTPException(400, "Invalid report.")
        c.execute("""UPDATE interviews SET status='completed',completed=?,overall=?,technical=?,problem=?,communication=?,clarity=?,decision=?,answered=?,skipped=?,report=? WHERE id=?""",
                  (now(), s.get("overall"), s.get("technical"), s.get("problemSolving"), s.get("communication"), s.get("clarity"), s.get("decision"),
                   sum(q.get("status") == "answered" for q in qs), sum(q.get("status") == "skipped" for q in qs), json.dumps(b.report), iid))
    return {"ok": True}

@app.get("/api/interviews")
def history(authorization: str | None = Header(None)):
    u = current(authorization)
    with db() as c:
        rows = c.execute("""SELECT id,role_id,role_title,completed,overall,technical,problem,communication,clarity,decision,answered,skipped
                            FROM interviews WHERE user_id=? AND status='completed' ORDER BY completed DESC""", (u["id"],)).fetchall()
    return [dict(r) for r in rows]

@app.get("/api/interviews/{iid}")
def report(iid: int, authorization: str | None = Header(None)):
    u = current(authorization)
    with db() as c:
        r = c.execute("SELECT * FROM interviews WHERE id=? AND user_id=? AND status='completed'", (iid, u["id"])).fetchone()
    if not r: raise HTTPException(404, "Report not found.")  # same answer for 'not yours' and 'doesn't exist'
    return {**json.loads(r["report"]), "id": r["id"], "completed": r["completed"]}
