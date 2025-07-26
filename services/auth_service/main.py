from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers.auth import router as auth_router
from .config import settings
from .models import user

app = FastAPI(
    title="Authentication Service",
    description="Handles user registration, login, and token management.",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.on_event("startup")
async def startup_event():
    from .database import engine
    user.Base.metadata.create_all(bind=engine)
    print("     📊 Database tables created")
