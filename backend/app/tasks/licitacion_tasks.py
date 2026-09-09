from celery import shared_task
from datetime import datetime, timezone
from app.models.db import get_db
from app.utils.audit_utils import registrar_cambio
from app.services.mailgun_service import enviar_recordatorio_vencimiento
import logging

logger = logging.getLogger(__name__)


@shared_task(name="app.tasks.licitacion_tasks.marcar_licitaciones_vencidas")
def marcar_licitaciones_vencidas():
    """
    Marca automáticamente como 'perdida' las licitaciones
    que hayan superado su fecha_limite y que continúen
    en estado 'activa'.
    """

    db = get_db()

    try:
        # Obtener únicamente licitaciones activas
        response = (
            db.table("licitaciones")
            .select("id, fecha_limite, estado")
            .eq("estado", "activa")
            .execute()
        )

        licitaciones_activas = response.data or []

        if not licitaciones_activas:
            logger.info("No hay licitaciones activas para verificar")

            return {
                "message": "No hay licitaciones activas",
                "procesadas": 0,
            }

        # Fecha/hora actual en UTC y con timezone
        ahora = datetime.now(timezone.utc)

        procesadas = 0
        errores = 0
        licitacion_ids = []

        for licitacion in licitaciones_activas:
            try:
                fecha_limite = licitacion.get("fecha_limite")

                if not fecha_limite:
                    logger.warning(
                        f"Licitación #{licitacion['id']} no tiene fecha_limite"
                    )
                    continue

                # Supabase normalmente devuelve ISO 8601.
                if isinstance(fecha_limite, str):
                    fecha_limite = datetime.fromisoformat(
                        fecha_limite.replace("Z", "+00:00")
                    )

                # Si por alguna razón la fecha viene sin timezone,
                # asumimos UTC para evitar comparar naive vs aware.
                if fecha_limite.tzinfo is None:
                    fecha_limite = fecha_limite.replace(tzinfo=timezone.utc)
                else:
                    fecha_limite = fecha_limite.astimezone(timezone.utc)

                # La licitación ya venció
                if fecha_limite <= ahora:

                    # Actualización condicionada:
                    # solo se cambia si todavía está activa.
                    update_response = (
                        db.table("licitaciones")
                        .update({
                            "estado": "perdida"
                        })
                        .eq("id", licitacion["id"])
                        .eq("estado", "activa")
                        .execute()
                    )

                    # Si no hubo registro actualizado,
                    # probablemente otra operación ya cambió el estado.
                    if not update_response.data:
                        logger.info(
                            f"Licitación #{licitacion['id']} "
                            "ya no estaba activa al momento de actualizar"
                        )
                        continue

                    # Registrar transición automática
                    db.table("historial_transiciones").insert({
                        "licitacion_id": licitacion["id"],
                        "usuario_id": None,  # Sistema
                        "estado_anterior": "activa",
                        "estado_nuevo": "perdida",
                    }).execute()

                    # Registrar auditoría
                    registrar_cambio(
                        "licitaciones",
                        licitacion["id"],
                        None,  # Sistema
                        "Estado",
                        "activa",
                        "perdida",
                    )

                    procesadas += 1
                    licitacion_ids.append(licitacion["id"])

                    logger.info(
                        f"Licitación #{licitacion['id']} "
                        "marcada automáticamente como perdida "
                        f"por vencimiento ({fecha_limite.isoformat()})"
                    )

            except Exception as e:
                errores += 1

                logger.exception(
                    f"Error procesando licitación "
                    f"#{licitacion.get('id')}: {e}"
                )

        logger.info(
            f"Proceso de vencimiento finalizado. "
            f"Procesadas: {procesadas}, Errores: {errores}"
        )

        return {
            "message": "Proceso de vencimiento completado",
            "procesadas": procesadas,
            "errores": errores,
            "licitacion_ids": licitacion_ids,
        }

    except Exception as e:
        logger.exception(
            f"Error general en tarea de vencimiento: {e}"
        )

        return {
            "error": str(e),
            "procesadas": 0,
        }

@shared_task(
    name="app.tasks.licitacion_tasks.enviar_recordatorios_vencimiento"
)
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
                fecha_limite = datetime.fromisoformat(
                    fecha_limite.replace("Z", "+00:00")
                )

            if fecha_limite.tzinfo is None:
                fecha_limite = fecha_limite.replace(
                    tzinfo=timezone.utc
                )

            fecha_limite = fecha_limite.astimezone(timezone.utc)

            horas_restantes = (
                fecha_limite - ahora
            ).total_seconds() / 3600

            if not (0 < horas_restantes < 48):
                continue

            cliente = licitacion.get("clientes") or {}
            email = cliente.get("email")

            if not email:
                continue

            nombre_cliente = (
                f"{cliente.get('nombre', '')} "
                f"{cliente.get('apellido', '')}"
            ).strip()

            enviar_recordatorio_vencimiento(
                cliente_email=email,
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

        except Exception:
            errores += 1

    return {
        "message": "Recordatorios procesados",
        "enviados": enviados,
        "errores": errores,
    }
