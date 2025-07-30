from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .domain import churn_service
from .routers import churn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

app.include_router(churn.router)

@app.on_event("startup")
async def startup_event():
    """Initialize database and load ML model on startup"""
    churn_service.load_model()
    print("✅ Application started successfully!")
    print("🤖 ML model loaded")
    print("🌐 CORS enabled for all origins")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        
        "message": "Churn Prediction API",
        "version": "1.0.0",
        "status": "running",
        "cors": "enabled",
        "endpoints": {
            "authentication": "/auth",
            "data_management": "/data", 
            "churn_prediction": "/churn"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "cors": "enabled",
        "timestamp": "2024-01-01T00:00:00Z"
    }

@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle OPTIONS requests for CORS preflight"""
    return {"message": "CORS preflight handled"}
