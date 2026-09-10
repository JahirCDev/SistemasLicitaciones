from fastapi import APIRouter, Depends

from app.schemas.usuario_schema import (
    UsuarioCreate,
    UsuarioResponse,
    UsuarioUpdate,
)

from app.services.usuario_services import (
    crear_usuario,
    listar_usuarios,
    login,
    obtener_perfil,
    obtener_usuario,
    obtener_historial_usuario,
    actualizar_usuario,
)

from app.core.security import verify_token

router = APIRouter(
    prefix="/usuarios",
    tags=["usuarios"]
)


@router.post("", response_model=UsuarioResponse)
async def crear_usuario_endpoint(
    usuario: UsuarioCreate
):
    return crear_usuario(usuario)


@router.get("", response_model=list[UsuarioResponse])
async def listar_usuarios_endpoint():
    return listar_usuarios()


@router.post("/login")
async def login_endpoint(
    email: str,
    password: str,
):
    return login(email, password)

@router.get("/me", response_model=UsuarioResponse)
async def obtener_perfil_endpoint(
    user_id: int = Depends(verify_token)
):
    return obtener_perfil(user_id)

@router.get("/{usuario_id}", response_model=UsuarioResponse)
async def obtener_usuario_endpoint(usuario_id: int):
    return obtener_usuario(usuario_id)

@router.get("/{usuario_id}/historial")
async def obtener_historial_usuario_endpoint(usuario_id: int):
    return obtener_historial_usuario(usuario_id)


@router.put("/{usuario_id}", response_model=UsuarioResponse)
async def actualizar_usuario_endpoint(
    usuario_id: int,
    usuario: UsuarioUpdate,
    user_id: int = Depends(verify_token),
):
    return actualizar_usuario(
        usuario_id,
        usuario,
        user_id,
    )