import logging
from fastapi import HTTPException
from app.models.db import get_db
from app.core.security import verify_password, create_access_token

from app.schemas.usuario_schema import UsuarioCreate
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)

logger = logging.getLogger(__name__)

def crear_usuario(usuario: UsuarioCreate):
    db = get_db()

    try:
        hashed = hash_password(usuario.password)

        response = db.table("usuarios").insert({
            "email": usuario.email,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "password_hash": hashed,
            "rol": "user",
        }).execute()

        return response.data[0]

    except Exception as error:
        logger.exception("Error al crear usuario")

        if getattr(error, "code", None) == "23505":
            raise HTTPException(
                status_code=409,
                detail="Email ya existe"
            )

        raise HTTPException(
            status_code=500,
            detail=f"Error de Supabase: {error}"
        )


def listar_usuarios():
    db = get_db()

    response = (
        db.table("usuarios")
        .select("id, email, nombre, apellido, rol")
        .execute()
    )

    return response.data


def login(email: str, password: str):
    db = get_db()
    try:
        print(f"Buscando usuario con email: {email}")
        usuario = db.table("usuarios").select("*").eq("email", email).execute()
        print(f"Usuario encontrado: {usuario.data}")
        
        if not usuario.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        usuario_data = usuario.data[0]
        print(f"Datos del usuario: {usuario_data}")
        
        print(f"Verificando contraseña...")
        if not verify_password(password, usuario_data["password_hash"]):
            raise HTTPException(status_code=401, detail="Contraseña incorrecta")
        
        print(f"Contraseña correcta, generando token...")
        access_token = create_access_token({"sub": str(usuario_data["id"])})
        
        response = {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": usuario_data["id"],
            "email": usuario_data["email"],
            "nombre": usuario_data.get("nombre"),
            "apellido": usuario_data.get("apellido"),
            "rol": usuario_data.get("rol"),
        }
        print(f"Response a retornar: {response}")
        return response
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en login: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

def obtener_perfil(user_id: int):
    """Obtiene el perfil del usuario autenticado"""
    db = get_db()
    try:
        usuario = (
            db.table("usuarios")
            .select("*")
            .eq("id", user_id)
            .execute()
        )
        if not usuario.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return usuario.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))