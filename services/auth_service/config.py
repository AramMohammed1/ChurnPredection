import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database settings
    database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres:admin@localhost/churn_prediction_db")

    # Security settings
    secret_key: str = os.getenv("SECRET_KEY", "ea51ec329259d89947b8fff10db4414d76b4db138b5818abf0689bf22e0b871c")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    refresh_token_expire_days: int = 30  # 30 days

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings() 