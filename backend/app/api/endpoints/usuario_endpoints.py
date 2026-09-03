from fastapi import APIRouter

from app.schemas.usuario_schema import (
    UsuarioCreate,
    UsuarioResponse,
    TokenResponse,
)

from app.services.usuario_services import (
    crear_usuario,
    listar_usuarios,
    login,
)


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


@router.post("/login", response_model=TokenResponse)
async def login_endpoint(
    email: str,
    password: str
):
    return login(email, password)