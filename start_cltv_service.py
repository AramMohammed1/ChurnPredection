import uvicorn
import os
from services.cltv_service.main import app

if __name__ == "__main__":
    port = int(os.getenv("CLTV_SERVICE_PORT", 8003))
    
    print(f"🚀 Starting CLTV Service on port {port}")
    print(f"📊 CLTV Analysis API will be available at http://localhost:{port}")
    print(f"🔗 Health check: http://localhost:{port}/health")
    
    uvicorn.run(
        "services.cltv_service.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    ) 