from celery import Celery
from app.core.config import get_settings
import platform

settings = get_settings()

worker_pool = "solo" if platform.system() == "Windows" else "prefork"

celery_app = Celery(
    "licitaciones",
    broker=settings.redis_url,  # ← Agregar a .env
    backend=settings.redis_url, # ← Para resultados (opcional)
    include=["app.tasks.licitacion_tasks"]    
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    worker_pool=worker_pool, 
    beat_schedule={
        "check-expired-biddings": {
            "task": "app.tasks.licitacion_tasks.marcar_licitaciones_vencidas",
            "schedule": 600.0,  # Cada 5 minutos (en segundos)
        },
        "send-expiration-reminders": {
            "task": "app.tasks.licitacion_tasks.enviar_recordatorios_vencimiento",
            "schedule": 600.0,
        },
    },
)