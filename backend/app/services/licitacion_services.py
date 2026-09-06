from fastapi import HTTPException
from app.models.db import get_db
from app.schemas.licitacion_schema import LicitacionCreate, LicitacionUpdate
from app.core.time import now_local_iso
from app.utils.audit_utils import registrar_cambio
from app.services.mailgun_service import enviar_resumen_licitacion

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
    def actualizar_licitacion(
        licitacion_id: int,
        licitacion_update: LicitacionUpdate,
        user_id: int,
    ):
        db = get_db()
        try:
            response_actual = (
                db.table("licitaciones")
                .select("*")
                .eq("id", licitacion_id)
                .execute()
            )
            if not response_actual.data:
                raise HTTPException(status_code=404, detail="Licitación no encontrada")

            licitacion_actual = response_actual.data[0]
            if licitacion_actual["estado"] not in ["borrador", "activa"]:
                raise HTTPException(
                    status_code=400,
                    detail="Solo se pueden editar licitaciones en borrador o activas",
                )

            presupuesto_nuevo = (
                licitacion_update.presupuesto_maximo
                if licitacion_update.presupuesto_maximo is not None
                else licitacion_actual["presupuesto_maximo"]
            )
            productos_actuales = (
                db.table("licitaciones_productos")
                .select("cantidad, precio")
                .eq("licitacion_id", licitacion_id)
                .execute()
            )
            total_productos = sum(
                producto["cantidad"] * producto["precio"]
                for producto in productos_actuales.data
            )
            if total_productos > presupuesto_nuevo:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"El total de productos (${total_productos:.2f}) "
                        f"no puede exceder el presupuesto máximo (${presupuesto_nuevo:.2f})"
                    ),
                )

            datos_update = {}
            for campo in ("cliente_id", "presupuesto_maximo", "fecha_limite"):
                nuevo_valor = getattr(licitacion_update, campo, None)
                valor_actual = licitacion_actual.get(campo)
                if nuevo_valor is None:
                    continue

                valor_nuevo_db = (
                    nuevo_valor.isoformat()
                    if campo == "fecha_limite"
                    else nuevo_valor
                )
                if valor_nuevo_db != valor_actual:
                    registrar_cambio(
                        "licitaciones",
                        licitacion_id,
                        user_id,
                        campo,
                        valor_actual,
                        valor_nuevo_db,
                    )
                    datos_update[campo] = valor_nuevo_db

            if not datos_update:
                return licitacion_actual

            datos_update["updated_at"] = now_local_iso()
            datos_update["updated_by"] = user_id
            response = (
                db.table("licitaciones")
                .update(datos_update)
                .eq("id", licitacion_id)
                .execute()
            )
            return response.data[0]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def agregar_producto(
        licitacion_id: int,
        producto_id: int,
        cantidad: int,
        user_id: int,
    ):
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
            prod = db.table("productos").select("nombre, precio").eq("id", producto_id).execute()
            if not prod.data:
                raise HTTPException(status_code=404, detail="Producto no encontrado")
            
            precio = prod.data[0]["precio"]

            productos_actuales = (
                db.table("licitaciones_productos")
                .select("cantidad, precio")
                .eq("licitacion_id", licitacion_id)
                .execute()
            )
            total_actual = sum(
                producto["cantidad"] * producto["precio"]
                for producto in productos_actuales.data
            )
            total_nuevo = total_actual + cantidad * precio
            if total_nuevo > licitacion["presupuesto_maximo"]:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"El total de productos (${total_nuevo:.2f}) "
                        f"no puede exceder el presupuesto máximo "
                        f"(${licitacion['presupuesto_maximo']:.2f})"
                    ),
                )
            
            # Insertar producto
            response = db.table("licitaciones_productos").insert({
                "licitacion_id": licitacion_id,
                "producto_id": producto_id,
                "cantidad": cantidad,
                "precio": precio
            }).execute()

            registrar_cambio(
                "licitaciones",
                licitacion_id,
                user_id,
                "Producto agregado",
                None,
                f"{prod.data[0]['nombre']} (cantidad: {cantidad})",
            )
            
            return response.data[0]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def actualizar_cantidad_producto(
        licitacion_id: int,
        producto_id: int,
        cantidad: int,
        user_id: int,
    ):
        db = get_db()
        try:
            lic = (
                db.table("licitaciones")
                .select("*")
                .eq("id", licitacion_id)
                .execute()
            )
            if not lic.data:
                raise HTTPException(status_code=404, detail="Licitación no encontrada")

            licitacion = lic.data[0]
            if licitacion["estado"] not in ["borrador", "activa"]:
                raise HTTPException(
                    status_code=400,
                    detail="Solo se pueden editar productos en borrador o activas",
                )

            productos = (
                db.table("licitaciones_productos")
                .select("*")
                .eq("licitacion_id", licitacion_id)
                .execute()
            )
            producto_actual = next(
                (
                    producto
                    for producto in productos.data
                    if producto["producto_id"] == producto_id
                ),
                None,
            )
            if not producto_actual:
                raise HTTPException(status_code=404, detail="Producto no encontrado en la licitación")

            producto_info = (
                db.table("productos")
                .select("nombre")
                .eq("id", producto_id)
                .execute()
            )

            total_sin_producto = sum(
                producto["cantidad"] * producto["precio"]
                for producto in productos.data
                if producto is not producto_actual
            )
            total_nuevo = total_sin_producto + cantidad * producto_actual["precio"]
            if total_nuevo > licitacion["presupuesto_maximo"]:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"El total de productos (${total_nuevo:.2f}) "
                        f"no puede exceder el presupuesto máximo "
                        f"(${licitacion['presupuesto_maximo']:.2f})"
                    ),
                )

            response = (
                db.table("licitaciones_productos")
                .update({"cantidad": cantidad})
                .eq("licitacion_id", licitacion_id)
                .eq("producto_id", producto_id)
                .execute()
            )
            registrar_cambio(
                "licitaciones",
                licitacion_id,
                user_id,
                (
                    f"Cantidad de {producto_info.data[0]['nombre']}"
                    if producto_info.data
                    else f"Cantidad de Producto #{producto_id}"
                ),
                producto_actual["cantidad"],
                cantidad,
            )
            return response.data[0]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def remover_producto(
        licitacion_id: int,
        producto_id: int,
        user_id: int,
    ):
        db = get_db()
        try:
            lic = db.table("licitaciones").select("*").eq("id", licitacion_id).execute()
            if not lic.data:
                raise HTTPException(status_code=404, detail="Licitación no encontrada")
            
            licitacion = lic.data[0]
            if licitacion["estado"] in ["finalizada", "por_cobrar", "cobrada", "perdida"]:
                raise HTTPException(status_code=400, detail="No se pueden remover productos de esta licitación")

            producto = (
                db.table("licitaciones_productos")
                .select("cantidad")
                .eq("licitacion_id", licitacion_id)
                .eq("producto_id", producto_id)
                .execute()
            )
            if not producto.data:
                raise HTTPException(status_code=404, detail="Producto no encontrado en la licitación")

            producto_info = (
                db.table("productos")
                .select("nombre")
                .eq("id", producto_id)
                .execute()
            )
            nombre_producto = (
                producto_info.data[0]["nombre"]
                if producto_info.data
                else f"Producto #{producto_id}"
            )
            
            db.table("licitaciones_productos").delete().eq("licitacion_id", licitacion_id).eq("producto_id", producto_id).execute()
            registrar_cambio(
                "licitaciones",
                licitacion_id,
                user_id,
                "Producto removido",
                f"{nombre_producto} (cantidad: {producto.data[0]['cantidad']})",
                "Producto eliminado",
            )
            return {"message": "Producto removido"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def subir_documento(
        licitacion_id: int,
        file_path: str,
        file_url: str,
        user_id: int,
        archivo: bytes,
        nombre_archivo: str,
        tipo_contenido: str,
    ):
        db = get_db()
        try:
            lic = db.table("licitaciones").select("*").eq("id", licitacion_id).execute()
            if not lic.data:
                raise HTTPException(status_code=404, detail="Licitación no encontrada")
            
            licitacion = lic.data[0]
            if licitacion["estado"] in ["finalizada", "por_cobrar", "cobrada", "perdida"]:
                raise HTTPException(status_code=400, detail="No se puede actualizar el documento")

            nuevo_estado = (
                "activa"
                if licitacion["estado"] == "borrador"
                else licitacion["estado"]
            )
            datos_update = {"documento_url": file_url, "estado": nuevo_estado}
            db.table("licitaciones").update(datos_update).eq("id", licitacion_id).execute()
            registrar_cambio(
                "licitaciones",
                licitacion_id,
                user_id,
                "Documento agregado",
                None,
                file_path.rsplit("/", 1)[-1],
            )
            if nuevo_estado != licitacion["estado"]:
                registrar_cambio(
                    "licitaciones",
                    licitacion_id,
                    user_id,
                    "Estado",
                    licitacion["estado"],
                    nuevo_estado,
                )
                cliente = (
                    db.table("clientes")
                    .select("nombre, apellido, email")
                    .eq("id", licitacion["cliente_id"])
                    .execute()
                )
                if not cliente.data:
                    raise HTTPException(
                        status_code=404,
                        detail="Cliente no encontrado para enviar el correo",
                    )

                productos_db = (
                    db.table("licitaciones_productos")
                    .select("producto_id, cantidad, precio")
                    .eq("licitacion_id", licitacion_id)
                    .execute()
                )
                productos = []
                for producto in productos_db.data:
                    producto_data = (
                        db.table("productos")
                        .select("nombre")
                        .eq("id", producto["producto_id"])
                        .execute()
                    )
                    productos.append(
                        {
                            **producto,
                            "nombre": (
                                producto_data.data[0]["nombre"]
                                if producto_data.data
                                else f"Producto #{producto['producto_id']}"
                            ),
                        }
                    )

                enviar_resumen_licitacion(
                    cliente_email=cliente.data[0]["email"],
                    cliente_nombre=(
                        f"{cliente.data[0]['nombre']} "
                        f"{cliente.data[0].get('apellido') or ''}"
                    ).strip(),
                    licitacion=licitacion | {
                        "documento_url": file_url,
                    },
                    productos=productos,
                    archivo=archivo,
                    nombre_archivo=nombre_archivo,
                    tipo_contenido=tipo_contenido,
                )
            return file_url
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def eliminar_documento(licitacion_id: int, user_id: int):
        db = get_db()
        try:
            response = (
                db.table("licitaciones")
                .select("documento_url, estado")
                .eq("id", licitacion_id)
                .execute()
            )
            if not response.data:
                raise HTTPException(status_code=404, detail="Licitación no encontrada")

            licitacion = response.data[0]
            if licitacion["estado"] not in ["borrador", "activa"]:
                raise HTTPException(
                    status_code=400,
                    detail="No se puede eliminar el documento en este estado",
                )
            if not licitacion.get("documento_url"):
                raise HTTPException(status_code=404, detail="No hay documento adjunto")

            from urllib.parse import unquote, urlparse

            url_path = unquote(urlparse(licitacion["documento_url"]).path)
            marker = "/object/public/propuestas/"
            if marker not in url_path:
                raise HTTPException(status_code=400, detail="Ruta de documento inválida")

            file_path = url_path.split(marker, 1)[1]
            nombre_archivo = file_path.rsplit("/", 1)[-1]
            db.storage.from_("propuestas").remove([file_path])
            db.table("licitaciones").update({"documento_url": None}).eq("id", licitacion_id).execute()
            registrar_cambio(
                "licitaciones",
                licitacion_id,
                user_id,
                "Documento eliminado",
                nombre_archivo,
                "Documento eliminado",
            )
            return {"message": "Documento eliminado"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def reenviar_correo(licitacion_id: int, user_id: int):
        from urllib.parse import unquote, urlparse

        db = get_db()
        try:
            lic_response = (
                db.table("licitaciones")
                .select("*")
                .eq("id", licitacion_id)
                .execute()
            )
            if not lic_response.data:
                raise HTTPException(status_code=404, detail="Licitación no encontrada")

            licitacion = lic_response.data[0]
            if licitacion["estado"] != "activa":
                raise HTTPException(
                    status_code=400,
                    detail="Solo se puede reenviar el correo de una licitación activa",
                )
            if not licitacion.get("documento_url"):
                raise HTTPException(status_code=400, detail="La licitación no tiene documento adjunto")

            marker = "/object/public/propuestas/"
            url_path = unquote(urlparse(licitacion["documento_url"]).path)
            if marker not in url_path:
                raise HTTPException(status_code=400, detail="Ruta de documento inválida")

            file_path = url_path.split(marker, 1)[1]
            nombre_archivo = file_path.rsplit("/", 1)[-1]
            archivo = db.storage.from_("propuestas").download(file_path)

            cliente = (
                db.table("clientes")
                .select("nombre, apellido, email")
                .eq("id", licitacion["cliente_id"])
                .execute()
            )
            if not cliente.data:
                raise HTTPException(status_code=404, detail="Cliente no encontrado")

            productos_db = (
                db.table("licitaciones_productos")
                .select("producto_id, cantidad, precio")
                .eq("licitacion_id", licitacion_id)
                .execute()
            )
            productos = []
            for producto in productos_db.data:
                producto_data = (
                    db.table("productos")
                    .select("nombre")
                    .eq("id", producto["producto_id"])
                    .execute()
                )
                productos.append({
                    **producto,
                    "nombre": producto_data.data[0]["nombre"] if producto_data.data else f"Producto #{producto['producto_id']}",
                })

            cliente_data = cliente.data[0]
            enviar_resumen_licitacion(
                cliente_email=cliente_data["email"],
                cliente_nombre=f"{cliente_data['nombre']} {cliente_data.get('apellido') or ''}".strip(),
                licitacion=licitacion,
                productos=productos,
                archivo=archivo,
                nombre_archivo=nombre_archivo,
                tipo_contenido="application/octet-stream",
            )
            registrar_cambio(
                "licitaciones",
                licitacion_id,
                user_id,
                "Correo reenviado",
                None,
                cliente_data["email"],
            )
            return {"message": "Correo reenviado"}
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
            registrar_cambio(
                "licitaciones",
                licitacion_id,
                user_id,
                "Estado",
                "borrador",
                "activa",
            )
            
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
            registrar_cambio(
                "licitaciones",
                licitacion_id,
                user_id,
                "Estado",
                licitacion["estado"],
                nuevo_estado,
            )
            
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
                "monto": monto,
                "usuario_id": user_id
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
                registrar_cambio(
                    "licitaciones",
                    licitacion_id,
                    user_id,
                    "Estado",
                    "por_cobrar",
                    "cobrada",
                )
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
        from app.utils.audit_utils import obtener_historial
        
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