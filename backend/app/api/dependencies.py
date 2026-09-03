from fastapi import HTTPException, Header
from app.core.security import verify_token

# Centraliza inyecciones
async def get_current_user(authorization: str = Header(None)) -> int:
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")
    return verify_token(authorization)