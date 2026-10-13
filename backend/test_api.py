import os, tempfile
os.environ["VOXHIRE_DB"] = os.path.join(tempfile.mkdtemp(), "t.db")
from fastapi.testclient import TestClient
import main, seed
c = TestClient(main.app)
H = lambda t: {"Authorization": f"Bearer {t}"}
def check(n, ok): print(("PASS " if ok else "FAIL ") + n); assert ok
r = c.post("/api/auth/signup", json={"name": "New User", "email": "new@x.com", "password": "Passw0rdX"}); check("signup", r.status_code == 200); t1 = r.json()["token"]
check("duplicate rejected", c.post("/api/auth/signup", json={"name": "N", "email": "NEW@x.com", "password": "Passw0rdX"}).status_code == 409)
check("weak password rejected", c.post("/api/auth/signup", json={"name": "N", "email": "a@x.com", "password": "short"}).status_code == 400)
check("bad credentials rejected", c.post("/api/auth/signin", json={"email": "new@x.com", "password": "wrong"}).status_code == 401)
for i in range(1, 6): check(f"seed account {i} signs in", c.post("/api/auth/signin", json={"email": f"candidate{i}@voxhire.local", "password": seed.PASSWORD}).status_code == 200)
check("protected without token", c.get("/api/interviews").status_code == 401)
sets = set()
for _ in range(12):
    s = c.post("/api/interviews/start", json={"role_id": "java"}, headers=H(t1)).json(); sets.add(s["set_index"])
check("random sets in range & varied", sets <= set(range(5)) and len(sets) > 1)
rep = {"summary": {"overall": 70, "technical": 70, "problemSolving": 60, "communication": 80, "clarity": 70, "decision": "FURTHER REVIEW"},
       "questions": [{"status": "answered"}, {"status": "skipped"}, {"status": "answered"}]}
check("complete saves", c.post(f"/api/interviews/{s['id']}/complete", json={"report": rep}, headers=H(t1)).status_code == 200)
check("double complete rejected", c.post(f"/api/interviews/{s['id']}/complete", json={"report": rep}, headers=H(t1)).status_code == 409)
h = c.get("/api/interviews", headers=H(t1)).json(); check("history counts only completed", len(h) == 1 and h[0]["skipped"] == 1)
t2 = c.post("/api/auth/signin", json={"email": "candidate1@voxhire.local", "password": seed.PASSWORD}).json()["token"]
check("other user history empty", c.get("/api/interviews", headers=H(t2)).json() == [])
check("other user cannot read report", c.get(f"/api/interviews/{s['id']}", headers=H(t2)).status_code == 404)
check("owner reads report", c.get(f"/api/interviews/{s['id']}", headers=H(t1)).status_code == 200)
c.post("/api/auth/signout", headers=H(t1)); check("signout invalidates token", c.get("/api/me", headers=H(t1)).status_code == 401)
