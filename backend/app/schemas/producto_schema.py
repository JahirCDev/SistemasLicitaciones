from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProductoCreate(BaseModel):
    nombre: str
    precio: float

class ProductoResponse(ProductoCreate):
    id: int
    created_at: datetime
    created_by: Optional[int] = None
    updated_at: Optional[datetime] = None
    updated_by: Optional[int] = None

class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    precio: Optional[float] = None
