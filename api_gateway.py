from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
import httpx
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="API Gateway")

# Allow all origins (for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SERVICE_MAP = {
    "auth": "http://localhost:8012",
    "data": "http://localhost:8011",
    "churn": "http://localhost:8013",
}

@app.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy(service: str, path: str, request: Request):
    if service not in SERVICE_MAP:
        return JSONResponse(status_code=404, content={"detail": "Service not found"})
    
    url = f"{SERVICE_MAP[service]}/{service}/{path}"
    method = request.method
    headers = dict(request.headers)
    params = dict(request.query_params)
    body = await request.body()

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.request(
                method,
                url,
                headers=headers,
                params=params,
                content=body,
                timeout=60.0
            )
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                headers=dict(resp.headers),
                media_type=resp.headers.get("content-type")
            )
        except httpx.RequestError as e:
            return JSONResponse(status_code=502, content={"detail": f"Upstream error: {str(e)}"})

@app.get("/")
async def root():
    return {"message": "API Gateway running. Use /auth, /data, /churn routes."} 