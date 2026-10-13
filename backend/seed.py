"""Development-only: creates 5 demo accounts. Run manually: python seed.py"""
from main import create_user, init
from fastapi import HTTPException
PASSWORD = "VoxHire@2026"
NAMES = ["Aarav Kumar", "Priya Nair", "Rahul Menon", "Sneha Iyer", "Karthik Raj"]
init()
for i, n in enumerate(NAMES, 1):
    try: create_user(n, f"candidate{i}@voxhire.local", PASSWORD); print("created", f"candidate{i}@voxhire.local")
    except HTTPException as e: print("skipped", f"candidate{i}@voxhire.local:", e.detail)
