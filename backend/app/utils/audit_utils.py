from datetime import datetime
from app.models.db import get_db

def registrar_cambio(
    tabla: str,
    registro_id: int,
    usuario_id: int,
    campo: str,
    valor_anterior,
    valor_nuevo
):
    """Registra un cambio en la tabla de historial correspondiente"""
    if valor_anterior == valor_nuevo:
        return  # No registrar si no cambió
    
    db = get_db()
    
    # Mapear tabla a su tabla de historial
    tablas_historial = {
        "clientes": "historial_clientes",
        "productos": "historial_productos",
        "licitaciones": "historial_licitaciones"
    }
    
    tabla_historial = tablas_historial.get(tabla)
    if not tabla_historial:
        print(f"Tabla desconocida para auditoría: {tabla}")
        return
    
    # Determinar la columna de FK según la tabla
    fk_column = {
        "clientes": "cliente_id",
        "productos": "producto_id",
        "licitaciones": "licitacion_id"
    }.get(tabla)
    
    try:
        db.table(tabla_historial).insert({
            fk_column: registro_id,
            "usuario_id": usuario_id,
            "campo_modificado": campo,
            "valor_anterior": str(valor_anterior) if valor_anterior is not None else None,
            "valor_nuevo": str(valor_nuevo),
            "created_at": datetime.utcnow().isoformat()
        }).execute()
    except Exception as e:
        print(f"Error registrando cambio en {tabla_historial}: {e}")

def obtener_historial(tabla: str, registro_id: int):
    """Obtiene el historial de cambios de un registro"""
    db = get_db()
    
    # Mapear tabla a su tabla de historial
    tablas_historial = {
        "clientes": "historial_clientes",
        "productos": "historial_productos",
        "licitaciones": "historial_licitaciones"
    }
    
    tabla_historial = tablas_historial.get(tabla)
    if not tabla_historial:
        return []
    
    # Determinar la columna de FK según la tabla
    fk_column = {
        "clientes": "cliente_id",
        "productos": "producto_id",
        "licitaciones": "licitacion_id"
    }.get(tabla)
    
    try:
        response = db.table(tabla_historial) \
            .select("*") \
            .eq(fk_column, registro_id) \
            .order("created_at", desc=False) \
            .execute()
        
        return response.data
    except Exception as e:
        print(f"Error obteniendo historial de {tabla_historial}: {e}")
        return []