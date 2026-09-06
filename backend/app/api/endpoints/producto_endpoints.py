from fastapi import APIRouter, Depends
from app.core.security import verify_token

from app.schemas.producto_schema import (
    ProductoCreate,
    ProductoResponse,
    ProductoUpdate,
)

from app.services.producto_services import (
    crear_producto,
    listar_productos,
    obtener_producto,
    actualizar_producto,
    obtener_historial_producto,
)


router = APIRouter(
    prefix="/productos",
    tags=["productos"]
)


@router.post("", response_model=ProductoResponse)
async def crear_producto_endpoint(
    producto: ProductoCreate,
    user_id: int = Depends(verify_token)
):
    return crear_producto(producto, user_id)


@router.get("", response_model=list[ProductoResponse])
async def listar_productos_endpoint(
    user_id: int = Depends(verify_token)
):
    return listar_productos()


@router.get("/{producto_id}", response_model=ProductoResponse)
async def obtener_producto_endpoint(
    producto_id: int,
    user_id: int = Depends(verify_token)
):
    return obtener_producto(producto_id)


@router.put("/{producto_id}", response_model=ProductoResponse)
async def actualizar_producto_endpoint(
    producto_id: int,
    producto_update: ProductoUpdate,
    user_id: int = Depends(verify_token)
):
    return actualizar_producto(
        producto_id,
        producto_update,
        user_id
    )


@router.get("/{producto_id}/historial")
async def obtener_historial_producto_endpoint(
    producto_id: int,
    user_id: int = Depends(verify_token)
):
    return obtener_historial_producto(producto_id)