import os
from typing import Optional
from pydantic import BaseSettings


class Settings(BaseSettings):
    # Database Configuration
    database_url: str = "postgresql://admin:admin@localhost:5432/churn_prediction_db"
    
    # Application Configuration
    app_name: str = "Churn Prediction Service"
    app_version: str = "1.0.0"
    debug: bool = True
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    
    class Config:
        env_file = "config.env"
        case_sensitive = False


# Global settings instance
settings = Settings() 