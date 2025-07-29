import os
from pydantic_settings import BaseSettings
from typing import List
from dotenv import load_dotenv

load_dotenv()
load_dotenv(dotenv_path=".secrets")

class Settings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL","postgresql://postgres:admin@localhost/churn_prediction_db")

    secret_key: str = os.getenv("SECRET_KEY","")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXP_MINUTES",10080))
    refresh_token_expire_days: int = int(os.getenv("REFRESH_TOKEN_EXP_DAYS",30))

settings = Settings() 