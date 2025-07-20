from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from . import churn_service
from .routers import auth, data, churn
from .config import settings

# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(data.router)
app.include_router(churn.router )

@app.on_event("startup")
async def startup_event():
    """Initialize database and load ML model on startup"""
    from .database import engine
    models.Base.metadata.create_all(bind=engine)
    churn_service.load_model()
    print("✅ Application started successfully!")
    print("📊 Database tables created")
    print("🤖 ML model loaded")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Churn Prediction API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "authentication": "/api/v1/auth",
            "data_management": "/api/v1/data", 
            "churn_prediction": "/api/v1/churn"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z"
    } 