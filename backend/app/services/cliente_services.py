from datetime import datetime
from fastapi import HTTPException
from app.models.db import get_db
from app.schemas.cliente_schema import ClienteCreate, ClienteUpdate

from app.utils.audit_utils import (
  registrar_cambio,
  obtener_historial,
)

def crear_cliente(cliente: ClienteCreate, user_id: int):
  db = get_db()

  try:
    response = (
        db.table("clientes")
        .insert({
            "nombre": cliente.nombre,
            "apellido": cliente.apellido,
            "email": cliente.email,
            "created_by": user_id,
            "updated_by": user_id,
        })
        .execute()
    )

    return response.data[0]

  except Exception as e:
    raise HTTPException(status_code=400, detail=str(e))
  

def listar_clientes():
  db = get_db()

  response = (
    db.table("clientes")
    .select("*")
    .execute()
  )

  return response.data


def obtener_cliente(cliente_id: int):
  db = get_db()

  response = (
    db.table("clientes")
    .select("*")
    .eq("id", cliente_id)
    .execute()
  )

  if not response.data:
    raise HTTPException( status_code=404, detail="Cliente no encontrado")
  return response.data[0]


def actualizar_cliente(
  cliente_id: int,
  cliente_update: ClienteUpdate,
  user_id: int
):
  db = get_db()

  try:
    response_actual = (
      db.table("clientes")
      .select("*")
      .eq("id", cliente_id)
      .execute()
    )

    if not response_actual.data:
      raise HTTPException(status_code=404, detail="Cliente no encontrado")

    cliente_actual = response_actual.data[0]
    datos_update = {}

    campos_editables = [
            "nombre",
            "apellido",
            "email",
        ]

    for campo in campos_editables: 
      nuevo_valor = getattr(cliente_update, campo, None)
      valor_actual = cliente_actual.get(campo)

      if (nuevo_valor is not None and nuevo_valor != valor_actual):
        registrar_cambio(
          "clientes",
          cliente_id,
          user_id,
          campo,
          valor_actual,
          nuevo_valor
        )

        datos_update[campo] = nuevo_valor

      if not datos_update:
        return cliente_actual

      datos_update["updated_at"] = datetime.utcnow().isoformat()
      datos_update["updated_by"] = user_id

      response = (
        db.table("clientes")
        .update(datos_update)
        .eq("id", cliente_id)
        .execute()
      )

      return response.data[0]

  except HTTPException:
    raise

  except Exception as e: raise HTTPException(status_code=400, detail=str(e))

def obtener_historial_cliente(cliente_id: int):
    db = get_db()

    cliente = (
      db.table("clientes")
      .select("id")
      .eq("id", cliente_id)
      .execute()
    )

    if not cliente.data:
      raise HTTPException(status_code=404, detail="Cliente no encontrado")

    return obtener_historial(
      "clientes",
      cliente_id
    )