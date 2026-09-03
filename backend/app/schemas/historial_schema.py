from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class HistorialResponse(BaseModel):
    id: int
    tabla: str  # 'clientes', 'productos', 'licitaciones'
    registro_id: int
    usuario_id: int
    campo_modificado: str
    valor_anterior: Optional[str] = None
    valor_nuevo: str
    created_at: datetime