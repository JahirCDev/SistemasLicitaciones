from fastapi import APIRouter, Depends
from app.core.security import verify_token

from app.schemas.cliente_schema import (
    ClienteCreate,
    ClienteResponse,
    ClienteUpdate,
)
from app.services.cliente_services import (
    crear_cliente,
    listar_clientes,
    obtener_cliente,
    actualizar_cliente,
    obtener_historial_cliente,
)

router = APIRouter(
    prefix="/clientes",
    tags=["clientes"]
)

@router.post("", response_model=ClienteResponse)
async def crear_cliente_endpoint(
    cliente: ClienteCreate,
    user_id: int = Depends(verify_token)
):
    return crear_cliente(cliente, user_id)

@router.get("", response_model=list[ClienteResponse])
async def listar_clientes_endpoint(
    user_id: int = Depends(verify_token)
):
    return listar_clientes()

@router.get("/{cliente_id}", response_model=ClienteResponse)
async def obtener_cliente_endpoint(
    cliente_id: int,
    user_id: int = Depends(verify_token)
):
    return obtener_cliente(cliente_id)

@router.put("/{cliente_id}", response_model=ClienteResponse)
async def actualizar_cliente_endpoint(
    cliente_id: int,
    cliente_update: ClienteUpdate,
    user_id: int = Depends(verify_token)
):
    return actualizar_cliente(
        cliente_id,
        cliente_update,
        user_id
    )

@router.get("/{cliente_id}/historial")
async def obtener_historial_cliente_endpoint(
    cliente_id: int,
    user_id: int = Depends(verify_token)
):
    return obtener_historial_cliente(cliente_id)