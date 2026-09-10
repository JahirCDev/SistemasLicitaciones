import logging
from fastapi import HTTPException
from app.models.db import get_db
from app.core.security import verify_password, create_access_token
from app.utils.audit_utils import obtener_historial
from app.schemas.usuario_schema import UsuarioCreate, UsuarioUpdate
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
        .select("id, email, nombre, apellido, rol, updated_at")
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

def obtener_usuario(usuario_id: int):
    db = get_db()

    try:
        response = (
            db.table("usuarios")
            .select("id, email, nombre, apellido, rol, created_at, updated_at")
            .eq("id", usuario_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Usuario no encontrado"
            )

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error obteniendo usuario")
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo usuario: {e}"
        )

def obtener_historial_usuario(usuario_id: int):
    return obtener_historial("usuarios", usuario_id)

def actualizar_usuario(
    usuario_id: int,
    usuario: UsuarioUpdate,
    modificado_por: int
):
    db = get_db()

    try:
        actual_response = (
            db.table("usuarios")
            .select("id, email, nombre, apellido, rol")
            .eq("id", usuario_id)
            .execute()
        )

        if not actual_response.data:
            raise HTTPException(
                status_code=404,
                detail="Usuario no encontrado"
            )

        actual = actual_response.data[0]

        cambios = usuario.model_dump(exclude_unset=True)

        if not cambios:
            return actual

        for campo, nuevo_valor in cambios.items():
            if nuevo_valor is None:
                continue

            valor_anterior = actual.get(campo)

            if valor_anterior != nuevo_valor:
                from app.utils.audit_utils import registrar_cambio

                registrar_cambio(
                    "usuarios",
                    usuario_id,
                    modificado_por,
                    campo,
                    valor_anterior,
                    nuevo_valor,
                )

        response = (
            db.table("usuarios")
            .update(cambios)
            .eq("id", usuario_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Usuario no encontrado"
            )

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error actualizando usuario")
        raise HTTPException(
            status_code=500,
            detail=f"Error actualizando usuario: {e}"
        )