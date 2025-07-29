from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import cltv

# Create FastAPI app
app = FastAPI()

# Allow all origins (for development) - MUST be before routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Include routers AFTER CORS middleware
app.include_router(cltv.router)

@app.on_event("startup")
async def startup_event():
    """Initialize database and load ML model on startup"""
    print("✅ CLTV Service started successfully!")
    print("🌐 CORS enabled for all origins")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "CLTV Analysis API",
        "version": "1.0.0",
        "status": "running",
        "cors": "enabled",
        "endpoints": {
            "cltv_analysis": "/cltv"
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

# Add explicit OPTIONS handler for debugging
@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle OPTIONS requests for CORS preflight"""
    return {"message": "CORS preflight handled"}
