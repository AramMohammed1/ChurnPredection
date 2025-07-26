import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database settings
    database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres:admin@localhost/churn_prediction")

    # Security settings
    secret_key: str = os.getenv("SECRET_KEY", "ea51ec329259d89947b8fff10db4414d76b4db138b5818abf0689bf22e0b871c")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    refresh_token_expire_days: int = 30  # 30 days
    
    # CORS settings
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://localhost:8080"
    ]
    
    # ML Model settings
    model_path: str = os.getenv("MODEL_PATH", "churn_service/best_model.pth")
    scaler_path: str = os.getenv("SCALER_PATH", "churn_service/scaler.pkl")
    
    # API settings
    api_title: str = "Churn Prediction API"
    api_description: str = "A microservices-based churn prediction system"
    api_version: str = "1.0.0"
    
    # Task management
    max_concurrent_tasks: int = 5
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Create global settings instance
settings = Settings() 