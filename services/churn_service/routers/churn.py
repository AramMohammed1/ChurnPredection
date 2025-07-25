import uuid
import threading
from typing import Dict, Optional
import asyncio
import pandas as pd
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from ..domain.tasks import *
from ..models.models import User
from ..utils.auth import get_current_user  # Use the new dependency
###############################
# api connection with the gateway about the user
from ..domain.churn import get_customer_sequence_scaled, predict_churn, predict_churned_customers, predict_churn_batch as predict_churn_batch_domain
from ..utils.data_service import get_all_customers

router = APIRouter(prefix="/churn", tags=["churn prediction"])


@router.get("/customers/{table_name}/{customer_id}/sequence")
async def get_customer_sequence(
    customer_id: int,
    table_name: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    access_token = request.headers.get("Authorization", "").replace("Bearer ", "")
    try:
        sequences, labels = await get_customer_sequence_scaled(customer_id, table_name, access_token)
        return {
            "customer_id": customer_id,
            "sequences": sequences,
            "labels": labels
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting customer sequence: {str(e)}")

@router.get("/progress/{task_id}")
async def get_progress(task_id: str, current_user: User = Depends(get_current_user)):
    """Get progress of a batch prediction task from Redis"""
    from ..domain.tasks import get_task
    task = get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {
        "task_id": task_id,
        "processed": task["processed"],
        "total": task["total"],
        "status": task["status"],
        "result": task.get("result"),
        "error": task.get("error")
    }

@router.post("/cancel/{task_id}")
async def cancel_task_endpoint(task_id: str, current_user: User = Depends(get_current_user)):
    """Cancel a running batch prediction task"""
    if task_id not in task_store:
        raise HTTPException(status_code=404, detail="Task not found")

    if cancel_task(task_id):
        return {"message": "Task cancelled successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to cancel task")

@router.post("/predict_batch")
async def predict_churn_batch(
    table_name: str = "",
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    access_token = request.headers.get("Authorization", "").replace("Bearer ", "")
    task_id = create_task()
    
    async def run_prediction():
        try:
            customers = await get_all_customers(table_name, access_token)
            df = pd.DataFrame(customers)
            total_customers = len(df['Customer ID'].unique())
            update_task_progress(task_id, 0, total_customers)

            # Use new batch prediction function
            predictions = await predict_churn_batch_domain(table_name, access_token, task_id=task_id, total_customers=total_customers, batch_size=500)
            update_task_progress(task_id, total_customers, total_customers)
            complete_task(task_id, predictions)
        except Exception as e:
            fail_task(task_id, str(e))
    
    def run_in_loop(coro):
        import asyncio
        asyncio.run(coro)
    thread = threading.Thread(target=run_in_loop, args=(run_prediction(),))
    thread.start()
    
    return {"task_id": task_id, "message": "Batch prediction started"}


@router.get("/predict/{customer_id}")
async def predict_churn_single(
    customer_id: int,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    access_token = request.headers.get("Authorization", "").replace("Bearer ", "")
    try:
        result, labels = await predict_churn(customer_id, f"user_data_{current_user['id']}", access_token)
        return {
            "customer_id": customer_id,
            "predictions": result,
            "actual_labels": labels
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting churn: {str(e)}")

@router.get("/churned_customers")
async def get_churned_customers_endpoint(
    table_name: str = "",
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    access_token = request.headers.get("Authorization", "").replace("Bearer ", "")
    try:
        predictions = await predict_churned_customers(table_name, access_token)
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting churned customers: {str(e)}") 