import logging
from fastapi import HTTPException
from app.models.db import get_db

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

    response = (
        db.table("usuarios")
        .select("*")
        .eq("email", email)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=401,
            detail="Credenciales inválidas"
        )

    usuario = response.data[0]

    if not verify_password(
        password,
        usuario["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Credenciales inválidas"
        )

    token = create_access_token({
        "sub": usuario["id"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": usuario["id"],
    }