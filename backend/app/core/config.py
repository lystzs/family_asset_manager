import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App Mode
    # Security
    SECRET_KEY: str = "your_super_secret_key_for_encryption"
    ALGORITHM: str = "HS256"

    # KIS API
    KIS_APP_KEY: str = ""
    KIS_APP_SECRET: str = ""
    KIS_ACCOUNT_NO: str = ""
    
    # Scheduler
    SCHEDULER_ENABLED: bool = True
    
    # Token Sync (Multi-Server)
    MASTER_API_URL: str = "" # If set, this server acts as a Client (Slave)
    SYNC_API_KEY: str = "fam_sync_secret" # Simple shared secret
    
    # Paths
    
    # Paths
    # backend/app/core/config.py -> backend/app/core -> backend/app -> backend -> root
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

def get_base_url() -> str:
    """Return KIS API Base URL (Real Only)"""
    return "https://openapi.koreainvestment.com:9443"

print(f"[Config] Loaded settings.")
