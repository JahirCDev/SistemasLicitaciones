from fastapi import HTTPException

from app.models.db import get_db
from app.schemas.producto_schema import ProductoCreate, ProductoUpdate
from app.core.time import now_local_iso
from app.utils.audit_utils import (
    registrar_cambio,
    obtener_historial,
)


def crear_producto(producto: ProductoCreate, user_id: int):
    db = get_db()

    try:
        response = db.table("productos").insert({
            "nombre": producto.nombre,
            "precio": producto.precio,
            "created_by": user_id,
            "updated_by": user_id,
        }).execute()

        return response.data[0]

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


def listar_productos():
    db = get_db()

    response = db.table("productos").select("*").execute()

    return response.data


def obtener_producto(producto_id: int):
    db = get_db()

    response = (
        db.table("productos")
        .select("*")
        .eq("id", producto_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    return response.data[0]


def actualizar_producto(
    producto_id: int,
    producto_update: ProductoUpdate,
    user_id: int
):
    db = get_db()

    try:
        # Obtener producto actual
        response_actual = (
            db.table("productos")
            .select("*")
            .eq("id", producto_id)
            .execute()
        )

        if not response_actual.data:
            raise HTTPException(
                status_code=404,
                detail="Producto no encontrado"
            )

        producto_actual = response_actual.data[0]

        # Preparar datos a actualizar
        datos_update = {}

        campos_editables = [
            "nombre",
            "precio",
        ]

        for campo in campos_editables:
            nuevo_valor = getattr(producto_update, campo, None)
            valor_actual = producto_actual.get(campo)

            if (
                nuevo_valor is not None
                and nuevo_valor != valor_actual
            ):
                registrar_cambio(
                    "productos",
                    producto_id,
                    user_id,
                    campo,
                    valor_actual,
                    nuevo_valor,
                )

                datos_update[campo] = nuevo_valor

        # No hay cambios
        if not datos_update:
            return producto_actual

        # Información de auditoría
        datos_update["updated_at"] = now_local_iso()

        datos_update["updated_by"] = user_id

        # Actualizar producto
        response = (
            db.table("productos")
            .update(datos_update)
            .eq("id", producto_id)
            .execute()
        )

        return response.data[0]

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


def obtener_historial_producto(producto_id: int):
    db = get_db()

    # Verificar que el producto existe
    producto = (
        db.table("productos")
        .select("id")
        .eq("id", producto_id)
        .execute()
    )

    if not producto.data:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    return obtener_historial(
        "productos",
        producto_id
    )