from fastapi import APIRouter, Depends

from app.schemas.usuario_schema import (
    UsuarioCreate,
    UsuarioResponse,
    TokenResponse,
)

from app.services.usuario_services import (
    crear_usuario,
    listar_usuarios,
    login,
    obtener_perfil,
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
