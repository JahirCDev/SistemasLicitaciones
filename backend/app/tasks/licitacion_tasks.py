from celery import shared_task
from datetime import datetime
from app.models.db import get_db
from app.utils.audit_utils import registrar_cambio
import logging

logger = logging.getLogger(__name__)

@shared_task(name="app.tasks.licitacion_tasks.marcar_licitaciones_vencidas")
def marcar_licitaciones_vencidas():
    """
    Tarea programada que marca como vencidas todas las licitaciones
    cuya fecha_limite ha pasado y están en estado 'activa'.
    """
    db = get_db()
    try:
        # Obtener licitaciones activas
        licitaciones_activas = db.table("licitaciones").select("*").eq("estado", "activa").execute()
        
        if not licitaciones_activas.data:
            logger.info("No hay licitaciones activas para verificar")
            return {"message": "No hay licitaciones activas", "procesadas": 0}
        
        ahora = datetime.utcnow()
        licitaciones_vencidas = []
        
        # Filtrar las que han vencido
        for licitacion in licitaciones_activas.data:
            fecha_limite = datetime.fromisoformat(
                licitacion["fecha_limite"].replace("Z", "+00:00")
            )
            
            if fecha_limite < ahora:
                licitaciones_vencidas.append(licitacion)
        
        if not licitaciones_vencidas:
            logger.info("No hay licitaciones vencidas")
            return {"message": "No hay licitaciones vencidas", "procesadas": 0}
        
        # Marcar como vencidas
        for licitacion in licitaciones_vencidas:
            try:
                db.table("licitaciones").update({
                    "estado": "finalizada"
                }).eq("id", licitacion["id"]).execute()
                
                # Registrar transición de estado
                db.table("historial_transiciones").insert({
                    "licitacion_id": licitacion["id"],
                    "usuario_id": None,  # Sistema
                    "estado_anterior": "activa",
                    "estado_nuevo": "finalizada"
                }).execute()
                
                # Registrar cambio en auditoría
                registrar_cambio(
                    "licitaciones",
                    licitacion["id"],
                    None,  # Sistema
                    "Estado",
                    "activa",
                    "finalizada",
                )
                
                logger.info(f"Licitación #{licitacion['id']} marcada como finalizada (vencida)")
                
            except Exception as e:
                logger.error(f"Error procesando licitación #{licitacion['id']}: {str(e)}")
        
        return {
            "message": f"{len(licitaciones_vencidas)} licitaciones marcadas como finalizada",
            "procesadas": len(licitaciones_vencidas),
            "licitacion_ids": [l["id"] for l in licitaciones_vencidas]
        }
        
    except Exception as e:
        logger.error(f"Error en tarea de vencimiento: {str(e)}")
        return {"error": str(e), "procesadas": 0}