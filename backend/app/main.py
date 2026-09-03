from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.endpoints import cliente_endpoints, producto_endpoints, licitacion_endpoints, usuario_endpoints

settings = get_settings()

app = FastAPI(title="Sistema de Gestión de Licitaciones", version="1.0.0", debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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
        "status": "ok",
        "environment": settings.environment,
        "debug": settings.debug
    }