from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.endpoints import cliente_endpoints, producto_endpoints, licitacion_endpoints, usuario_endpoints
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

app = FastAPI(title="Sistema de Gestión de Licitaciones", version="1.0.0", debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://sistemas-licitaciones.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cliente_endpoints.router, prefix="/api")
app.include_router(producto_endpoints.router, prefix="/api")
app.include_router(licitacion_endpoints.router, prefix="/api")
app.include_router(usuario_endpoints.router, prefix="/api")

@app.get("/health")
async def health():
    return {
        "status": "DEPLOY_TESTING_122121",
        "cors_test": True
    }

@app.get("/debug-info")
async def debug_info():
    return {
        "app": "licitaciones-backend",
        "environment": settings.environment,
        "debug": settings.debug,
        "cors_origins": [
            "https://sistemas-licitaciones.vercel.app"
        ],
        "routes": [
            str(route.path)
            for route in app.routes
        ],
    }

@app.get("/__DEPLOY_TEST_122121__")
async def deploy_test():
    return {
        "message": "ESTE ES EL MAIN.PY CORRECTO",
        "version": "122121"
    }