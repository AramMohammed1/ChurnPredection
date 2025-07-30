#!/usr/bin/env python3
"""
Startup script for the Segmentation Service
"""
import uvicorn
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), 'services'))

if __name__ == "__main__":
    print("🚀 Starting Segmentation Service...")
    print("📍 Port: 8014")
    print("🔗 URL: http://localhost:8014")
    
    uvicorn.run(
        "segmentation_service.main:app",
        host="0.0.0.0",
        port=8014,
        reload=True,
        log_level="info"
    ) 