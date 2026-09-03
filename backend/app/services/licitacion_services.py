from fastapi import HTTPException
from app.models.db import get_db
from app.schemas.licitacion_schema import LicitacionCreate

class LicitacionService:
    @staticmethod
    def crear_licitacion(licitacion: LicitacionCreate, user_id: int):
        db = get_db()
        try:
            response = db.table("licitaciones").insert({
                "cliente_id": licitacion.cliente_id,
                "usuario_id": user_id,
                "presupuesto_maximo": licitacion.presupuesto_maximo,
                "fecha_limite": licitacion.fecha_limite.isoformat(),
                "estado": "borrador",
                "created_by": user_id,
                "updated_by": user_id
            }).execute()
            return response.data[0]
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def listar_licitaciones():
        db = get_db()
        try:
            response = db.table("licitaciones").select("*").execute()
            return response.data
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def obtener_licitacion(licitacion_id: int):
        db = get_db()
        try:
            response = db.table("licitaciones").select("*").eq("id", licitacion_id).execute()
            if not response.data:
                raise HTTPException(status_code=404, detail="Licitación no encontrada")
            return response.data[0]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def agregar_producto(licitacion_id: int, producto_id: int, cantidad: int):
        db = get_db()
        try:
            # Verificar licitación existe
            lic = db.table("licitaciones").select("*").eq("id", licitacion_id).execute()
            if not lic.data:
                raise HTTPException(status_code=404, detail="Licitación no encontrada")
            
            licitacion = lic.data[0]
            
            # Validar estado
            if licitacion["estado"] in ["finalizada", "por_cobrar", "cobrada", "perdida"]:
                raise HTTPException(status_code=400, detail="No se pueden agregar productos a esta licitación")
            
            # Obtener precio del producto
            prod = db.table("productos").select("precio").eq("id", producto_id).execute()
            if not prod.data:
                raise HTTPException(status_code=404, detail="Producto no encontrado")
            
            precio = prod.data[0]["precio"]
            
            # Insertar producto
            response = db.table("licitaciones_productos").insert({
                "licitacion_id": licitacion_id,
                "producto_id": producto_id,
                "cantidad": cantidad,
                "precio": precio
            }).execute()
            
            return response.data[0]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def remover_producto(licitacion_id: int, producto_id: int):
        db = get_db()
        try:
            lic = db.table("licitaciones").select("*").eq("id", licitacion_id).execute()
            if not lic.data:
                raise HTTPException(status_code=404, detail="Licitación no encontrada")
            
            licitacion = lic.data[0]
            if licitacion["estado"] in ["finalizada", "por_cobrar", "cobrada", "perdida"]:
                raise HTTPException(status_code=400, detail="No se pueden remover productos de esta licitación")
            
            db.table("licitaciones_productos").delete().eq("licitacion_id", licitacion_id).eq("producto_id", producto_id).execute()
            return {"message": "Producto removido"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def subir_documento(licitacion_id: int, file_path: str, file_url: str):
        db = get_db()
        try:
            lic = db.table("licitaciones").select("*").eq("id", licitacion_id).execute()
            if not lic.data:
                raise HTTPException(status_code=404, detail="Licitación no encontrada")
            
            licitacion = lic.data[0]
            if licitacion["estado"] in ["finalizada", "por_cobrar", "cobrada", "perdida"]:
                raise HTTPException(status_code=400, detail="No se puede actualizar el documento")
            
            db.table("licitaciones").update({"documento_url": file_url}).eq("id", licitacion_id).execute()
            return file_url
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def enviar_licitacion(licitacion_id: int, user_id: int):
        db = get_db()
        try:
            lic = db.table("licitaciones").select("*").eq("id", licitacion_id).execute()
            if not lic.data:
                raise HTTPException(status_code=404, detail="Licitación no encontrada")
            
            licitacion = lic.data[0]
            
            if licitacion["estado"] != "borrador":
                raise HTTPException(status_code=400, detail="La licitación debe estar en borrador")
            
            if not licitacion["documento_url"]:
                raise HTTPException(status_code=400, detail="Debe subir un documento antes de enviar")
            
            # Cambiar estado
            db.table("licitaciones").update({"estado": "activa"}).eq("id", licitacion_id).execute()
            
            # Registrar en historial
            db.table("historial_transiciones").insert({
                "licitacion_id": licitacion_id,
                "usuario_id": user_id,
                "estado_anterior": "borrador",
                "estado_nuevo": "activa"
            }).execute()
            
            return {"message": "Licitación enviada", "estado": "activa"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def cambiar_estado(licitacion_id: int, nuevo_estado: str, estado_anterior_esperado: str, user_id: int):
        db = get_db()
        try:
            lic = db.table("licitaciones").select("*").eq("id", licitacion_id).execute()
            if not lic.data:
                raise HTTPException(status_code=404, detail="Licitación no encontrada")
            
            licitacion = lic.data[0]
            
            if licitacion["estado"] != estado_anterior_esperado:
                raise HTTPException(
                    status_code=400, 
                    detail=f"La licitación debe estar en estado '{estado_anterior_esperado}'"
                )
            
            db.table("licitaciones").update({"estado": nuevo_estado}).eq("id", licitacion_id).execute()
            
            db.table("historial_transiciones").insert({
                "licitacion_id": licitacion_id,
                "usuario_id": user_id,
                "estado_anterior": licitacion["estado"],
                "estado_nuevo": nuevo_estado
            }).execute()
            
            return {"message": f"Licitación marcada como {nuevo_estado}", "estado": nuevo_estado}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def registrar_pago(licitacion_id: int, monto: float, user_id: int):
        db = get_db()
        try:
            lic = db.table("licitaciones").select("*").eq("id", licitacion_id).execute()
            if not lic.data:
                raise HTTPException(status_code=404, detail="Licitación no encontrada")
            
            licitacion = lic.data[0]
            if licitacion["estado"] != "por_cobrar":
                raise HTTPException(status_code=400, detail="La licitación debe estar en 'por_cobrar'")
            
            # Calcular totales
            productos = db.table("licitaciones_productos").select("cantidad, precio").eq("licitacion_id", licitacion_id).execute()
            total_facturado = sum(p["cantidad"] * p["precio"] for p in productos.data) if productos.data else 0
            
            pagos = db.table("pagos").select("monto").eq("licitacion_id", licitacion_id).execute()
            total_pagado = sum(p["monto"] for p in pagos.data) if pagos.data else 0
            
            saldo_pendiente = total_facturado - total_pagado
            
            if monto > saldo_pendiente:
                raise HTTPException(status_code=400, detail=f"El pago no puede exceder ${saldo_pendiente:.2f}")
            
            # Registrar pago
            db.table("pagos").insert({
                "licitacion_id": licitacion_id,
                "monto": monto
            }).execute()
            
            nuevo_saldo = saldo_pendiente - monto
            
            # Si se paga todo, marcar como cobrada
            if nuevo_saldo <= 0.01:
                db.table("licitaciones").update({"estado": "cobrada"}).eq("id", licitacion_id).execute()
                db.table("historial_transiciones").insert({
                    "licitacion_id": licitacion_id,
                    "usuario_id": user_id,
                    "estado_anterior": "por_cobrar",
                    "estado_nuevo": "cobrada"
                }).execute()
                return {"message": "Pago registrado y licitación cobrada", "estado": "cobrada", "saldo": 0}
            
            return {"message": "Pago registrado", "saldo_pendiente": nuevo_saldo}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def obtener_detalle(licitacion_id: int):
        db = get_db()
        try:
            lic = db.table("licitaciones").select("*").eq("id", licitacion_id).execute()
            if not lic.data:
                raise HTTPException(status_code=404, detail="Licitación no encontrada")
            
            productos = db.table("licitaciones_productos").select("*").eq("licitacion_id", licitacion_id).execute()
            pagos = db.table("pagos").select("*").eq("licitacion_id", licitacion_id).execute()
            
            total_facturado = sum(p["cantidad"] * p["precio"] for p in productos.data) if productos.data else 0
            total_pagado = sum(p["monto"] for p in pagos.data) if pagos.data else 0
            
            return {
                "licitacion": lic.data[0],
                "productos": productos.data or [],
                "pagos": pagos.data or [],
                "total_facturado": total_facturado,
                "total_pagado": total_pagado,
                "saldo_pendiente": total_facturado - total_pagado
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def obtener_historial(licitacion_id: int):
        from backend.app.utils.audit_utils import obtener_historial
        
        db = get_db()
        try:
            lic = db.table("licitaciones").select("*").eq("id", licitacion_id).execute()
            if not lic.data:
                raise HTTPException(status_code=404, detail="Licitación no encontrada")
            
            return obtener_historial("licitaciones", licitacion_id)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))