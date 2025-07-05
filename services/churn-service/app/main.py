from fastapi import FastAPI
from app.api.routes import router as api_router
from app.infrastructure.config import settings
from app.infrastructure.database import create_tables

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug
)

# Include API router
app.include_router(api_router)

@app.on_event("startup")
def on_startup():
    create_tables()
