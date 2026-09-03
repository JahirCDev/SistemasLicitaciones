from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LicitacionCreate(BaseModel):
    cliente_id: int
    presupuesto_maximo: float
    fecha_limite: datetime

class LicitacionResponse(BaseModel):
    id: int
    cliente_id: int
    usuario_id: int
    estado: str
    presupuesto_maximo: float
    fecha_limite: datetime
    documento_url: Optional[str]
    created_at: datetime
    created_by: Optional[int] = None
    updated_at: Optional[datetime] = None
    updated_by: Optional[int] = None

class AgregarProductoRequest(BaseModel):
    producto_id: int
    cantidad: int

class PagoCreate(BaseModel):
    licitacion_id: int
    monto: float

