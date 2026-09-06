"""
Módulo de seguridad: Hash, JWT y verificación de tokens.
"""

from argon2 import PasswordHasher
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, Header
import logging
from typing import Optional

from app.core.config import get_settings

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Instancia de Argon2 para hash de contraseñas
ph = PasswordHasher()


# ============ FUNCIONES DE HASH ============

def hash_password(password: str) -> str:
    """
    Hashea una contraseña usando Argon2.
    
    Args:
        password: Contraseña en texto plano
        
    Returns:
        Hash seguro de la contraseña
    """
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica una contraseña contra su hash.
    
    Args:
        plain_password: Contraseña en texto plano
        hashed_password: Hash almacenado en la BD
        
    Returns:
        True si coinciden, False si no
    """
    try:
        ph.verify(hashed_password, plain_password)
        return True
    except Exception:
        return False


# ============ FUNCIONES DE JWT ============

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Crea un JWT con los datos proporcionados.
    
    Args:
        data: Diccionario con los datos del token (ej: {"sub": user_id})
        expires_delta: Duración del token. Si no se proporciona, usa el default.
        
    Returns:
        Token JWT codificado
        
    Example:
        token = create_access_token({"sub": 1})
    """
    settings = get_settings()
    to_encode = data.copy()

    # Asegurar que 'sub' es string (requerido por JWT)
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])

    # Calcular expiración
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
    """
    Verifica un JWT y retorna el user_id.
    
    Uso en endpoints:
        @router.get("/clientes")
        async def listar_clientes(user_id: int = Depends(verify_token)):
            # user_id es garantizado válido
            ...
    
    Args:
        authorization: Header 'Authorization' (ej: "Bearer <token>")
        
    Returns:
        user_id del token
        
    Raises:
        HTTPException 401: Si el token es inválido o no existe
    """
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