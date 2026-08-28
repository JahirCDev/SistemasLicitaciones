from .db import supabase
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os


load_dotenv()

app = FastAPI(
    title="Sistema de Gestión de Licitaciones",
    version="0.1.0"
)

# CORS para permitir requests desde React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/health/supabase")
def supabase_health():
    response = supabase.table("clientes").select("*").limit(1).execute()
    data = response.get("data", []) if isinstance(response, dict) else response.data
    return {
        "connected": True,
        "rows": len(data)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)