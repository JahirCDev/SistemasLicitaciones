from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import get_settings
from app.api.endpoints import cliente_endpoints, producto_endpoints, licitacion_endpoints, usuario_endpoints
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

app = FastAPI(title="Sistema de Gestión de Licitaciones", version="1.0.0", debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cliente_endpoints.router, prefix="/api")
app.include_router(producto_endpoints.router, prefix="/api")
app.include_router(licitacion_endpoints.router, prefix="/api")
app.include_router(usuario_endpoints.router, prefix="/api")

@app.options("/{path:path}")
async def preflight(path: str):
    return JSONResponse(
        {"status": "ok"},
        headers={
            "Access-Control-Allow-Origin": "*",  # ← TEMPORAL
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "environment": settings.environment,
        "debug": settings.debug
    }


@app.get("/debug-info")
async def debug_info():
    return {
        "app": "licitaciones-backend",
        "cors": True,
        "routes": [
            str(route.path)
            for route in app.routes
        ],
    }