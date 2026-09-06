from pathlib import Path
from app.core.config import get_settings
from supabase import Client, create_client

settings = get_settings()

url = settings.supabase_url
key = settings.supabase_service_role_key or settings.supabase_key
jwks = settings.supabase_jwks_url 

if not url or not key:
    raise RuntimeError(
        "Faltan SUPABASE_URL y SUPABASE_KEY en backend/.env"
    )

supabase: Client = create_client(url, key)

def get_db():
    return supabase