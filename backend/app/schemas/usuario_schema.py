from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UsuarioCreate(BaseModel):
    email: EmailStr
    password: str
    nombre: str
    apellido: Optional[str] = None

class UsuarioUpdate(BaseModel):
    email: Optional[EmailStr] = None
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    rol: Optional[str] = None

class UsuarioResponse(BaseModel):
    id: int
    email: str
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    rol: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    rol: Optional[str] = None
