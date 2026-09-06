from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ClienteCreate(BaseModel):
    nombre: str
    apellido: Optional[str] = None
    email: EmailStr

class ClienteResponse(ClienteCreate):
    id: int
    created_at: datetime
    created_by: Optional[int] = None
    updated_at: Optional[datetime] = None
    updated_by: Optional[int] = None

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    email: Optional[EmailStr] = None