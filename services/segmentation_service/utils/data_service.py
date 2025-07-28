import os
import httpx
from typing import Any, Dict, List

DATA_SERVICE_URL = os.getenv("DATA_SERVICE_URL", "http://localhost:8011")

async def get_all_customers(table_name: str, access_token: str) -> List[Dict[str, Any]]:
    """
    Fetch all customers from the data service for the given table_name.
    """
    url = f"{DATA_SERVICE_URL}/data/customers/all/{table_name}/"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
        if resp.status_code == 200:
            return resp.json()
        else:
            raise Exception(f"Data service error: {resp.status_code} {resp.text}") 