from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers.data import router as data_router
from .models import uploadHistory
app = FastAPI(title="Data Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data_router)

@app.on_event("startup")
async def startup_event():
    from .database import engine
    uploadHistory.Base.metadata.create_all(bind=engine)
    print("     📊 Database tables created")

