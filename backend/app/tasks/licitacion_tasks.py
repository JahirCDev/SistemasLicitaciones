from datetime import datetime, timezone
from app.models.db import get_db
from app.utils.audit_utils import registrar_cambio
from app.services.mailgun_service import enviar_recordatorio_vencimiento
import logging

logger = logging.getLogger(__name__)


def marcar_licitaciones_vencidas():
    db = get_db()

    response = (
        db.table("licitaciones")
        .select("id, fecha_limite, estado")
        .eq("estado", "activa")
        .execute()
    )

    licitaciones_activas = response.data or []

    ahora = datetime.now(timezone.utc)
    procesadas = 0
    errores = 0
    licitacion_ids = []

    for licitacion in licitaciones_activas:
        try: 
            fecha_limite = licitacion.get("fecha_limite")

            if not fecha_limite:
                continue

            if isinstance(fecha_limite, str):
                fecha_limite = datetime.fromisoformat(fecha_limite.replace("Z", "+00:00"))

            if fecha_limite.tzinfo is None:
                fecha_limite = fecha_limite.replace(tzinfo=timezone.utc)
            else:
                fecha_limite = fecha_limite.astimezone(timezone.utc)

            if fecha_limite <= ahora:
                update_response = (
                    db.table("licitaciones")
                    .update({"estado": "perdida"})
                    .eq("id", licitacion["id"])
                    .eq("estado", "activa")
                    .execute()
                )

                if not update_response.data:
                    continue

                db.table("historial_transiciones").insert({
                    "licitacion_id": licitacion["id"],
                    "usuario_id": None,
                    "estado_anterior": "activa",
                    "estado_nuevo": "perdida",
                }).execute()

                registrar_cambio(
                    "licitaciones",
                    licitacion["id"],
                    None,
                    "Estado",
                    "activa",
                    "perdida",
                )

                procesadas += 1
                licitacion_ids.append(licitacion["id"])

        except Exception:
            errores += 1
            logger.exception("Error procesando licitación vencida")

    return {
        "procesadas": procesadas,
        "errores": errores,
        "licitacion_ids": licitacion_ids,
    }

def enviar_recordatorios_vencimiento():
    db = get_db()

    response = (
        db.table("licitaciones")
        .select("""
            id,
            fecha_limite,
            estado,
            recordatorio_vencimiento_enviado,
            clientes (
                id,
                nombre,
                apellido,
                email
            )
        """)
        .eq("estado", "activa")
        .eq("recordatorio_vencimiento_enviado", False)
        .execute()
    )

    licitaciones = response.data or []
    ahora = datetime.now(timezone.utc)

    enviados = 0
    errores = 0

    for licitacion in licitaciones:
        try:
            fecha_limite = licitacion.get("fecha_limite")

            if not fecha_limite:
                continue

            if isinstance(fecha_limite, str):
                fecha_limite = datetime.fromisoformat(fecha_limite.replace("Z", "+00:00"))

            if fecha_limite.tzinfo is None:
                fecha_limite = fecha_limite.replace(tzinfo=timezone.utc)
            else:
                fecha_limite = fecha_limite.astimezone(timezone.utc)

            horas_restantes = (fecha_limite - ahora).total_seconds() / 3600

            if not (0 < horas_restantes < 48):
                continue

            cliente = licitacion.get("clientes") or {}
            correo = cliente.get("email")

            if not correo:
                continue

            nombre_cliente = (
                f"{cliente.get('nombre', '')} "
                f"{cliente.get('apellido', '')}"
            ).strip()

            enviar_recordatorio_vencimiento(
                cliente_email=correo,
                cliente_nombre=nombre_cliente,
                licitacion=licitacion,
            )

            db.table("licitaciones").update({
                "recordatorio_vencimiento_enviado": True
            }).eq(
                "id", licitacion["id"]
            ).eq(
                "estado", "activa"
            ).execute()

            enviados += 1

        except Exception as e:
            errores += 1
            logger.exception(
                "Error enviando recordatorio para licitación %s: %s",
                licitacion.get("id"),
                e,
            )

    return {
        "message": "Recordatorios procesados",
        "enviados": enviados,
        "errores": errores,
    }
