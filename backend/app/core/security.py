from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException, Header
from typing import Optional
import logging
from app.core.config import get_settings

logger = logging

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_context.verify(hashed_password, plain_password)
        return True
    except Exception:
        return False

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:

    settings = get_settings()
    to_encode = data.copy()

    # Asegurar que 'sub' es string (requerido por JWT)
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.jwt_expiration_days)

    to_encode.update({"exp": expire})

    # Codificar JWT
    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm
    )

    logger.info(f"✓ Token creado para user_id: {data.get('sub')}")
    return encoded_jwt


def verify_token(authorization: str = Header(None)) -> int:
    settings = get_settings()

    # Validar que existe el header
    if not authorization:
        logger.warning("❌ Intento de acceso sin token")
        raise HTTPException(status_code=401, detail="Missing token")

    # Validar formato "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        logger.warning(f"❌ Authorization header mal formado: {authorization[:30]}...")
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    token = parts[1]

    try:
        # Decodificar JWT
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )

        # Extraer user_id del claim 'sub'
        user_id_str = payload.get("sub")
        if user_id_str is None:
            logger.warning("❌ Token sin claim 'sub'")
            raise HTTPException(status_code=401, detail="Invalid token: missing 'sub'")

        user_id = int(user_id_str)
        logger.info(f"✓ Token válido para user_id: {user_id}")
        return user_id

    except JWTError as e:
        logger.error(f"❌ JWT Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except ValueError:
        logger.error("❌ 'sub' no es un entero válido")
        raise HTTPException(status_code=401, detail="Invalid token format")
    except Exception as e:
        logger.error(f"❌ Error inesperado al verificar token: {str(e)}")
        raise HTTPException(status_code=401, detail="Token verification failed")