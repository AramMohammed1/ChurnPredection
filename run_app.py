#!/usr/bin/env python3
"""
Startup script for the Churn Prediction API
"""
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "true").lower() == "true"
    
    print("🚀 Starting Churn Prediction API...")
    print(f"📍 Host: {host}")
    print(f"🔌 Port: {port}")
    print(f"🔄 Reload: {reload}")
    print("=" * 50)
    
    # Start the application
    uvicorn.run(
        "churn_service.main_new:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    ) 