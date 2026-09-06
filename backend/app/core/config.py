from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Literal, Optional

class Settings(BaseSettings):
    """
    Configuración centralizada de la aplicación.
    Las variables se cargan desde .env y se validan automáticamente.
    """

    supabase_url: str
    supabase_key: str
    supabase_service_role_key: Optional[str] = None
    supabase_jwks_url: str

    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_days: int = 7

    mailgun_api_key: Optional[str] = None
    mailgun_domain: Optional[str] = None
    mailgun_from_email: Optional[str] = None

    rabbitmq_url: str = "amqp://guest:guest@localhost:5672//"
    redis_url: str = "redis://localhost:6379/0"
    
    # database_url: str = ""

    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = False  # Lee SUPABASE_URL

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        return self.environment == "development"


@lru_cache()
def get_settings() -> Settings:
    """
    Carga la configuración una sola vez y la cachea.
    
    Uso en otros archivos:
        from app.core.config import get_settings
        settings = get_settings()
    """
    return Settings()