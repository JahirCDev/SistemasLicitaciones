from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UsuarioCreate(BaseModel):
    email: EmailStr
    password: str
    nombre: str
    apellido: Optional[str] = None

class UsuarioResponse(BaseModel):
    id: int
    email: str
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    rol: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int