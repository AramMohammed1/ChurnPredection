import uuid
import threading
from typing import Dict, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ..models import User
from ..routers.auth import get_current_user
from ..domain import get_customer_sequence_scaled, predict_churn, predict_churned_customers
from ..database.repositories import get_all_customers_from_db

router = APIRouter(prefix="/churn", tags=["churn prediction"])

# Global task store to track progress
task_store: Dict[str, Dict] = {}

def create_task() -> str:
    """Create a new task and return its ID"""
    task_id = str(uuid.uuid4())
    task_store[task_id] = {
        "processed": 0,
        "total": 0,
        "status": "in_progress",
        "result": None,
        "error": None
    }
    return task_id

def update_task_progress(task_id: str, processed: int, total: int, status: str = "in_progress"):
    """Update task progress"""
    if task_id in task_store:
        task_store[task_id].update({
            "processed": processed,
            "total": total,
            "status": status
        })

def complete_task(task_id: str, result, status: str = "done"):
    """Mark task as complete with result"""
    if task_id in task_store:
        task_store[task_id].update({
            "status": status,
            "result": result
        })

def fail_task(task_id: str, error: str):
    """Mark task as failed"""
    if task_id in task_store:
        task_store[task_id].update({
            "status": "failed",
            "error": error
        })

def cancel_task(task_id: str):
    """Cancel a running task"""
    if task_id in task_store:
        task_store[task_id].update({
            "status": "cancelled",
            "error": "Task was cancelled by user"
        })
        return True
    return False

@router.get("/customers/{table_name}/{customer_id}/sequence")
async def get_customer_sequence(
    customer_id: int, 
    table_name: str, 
    current_user: User = Depends(get_current_user)
):
    """Get customer sequence data for churn prediction"""
    try:
        sequences, labels = get_customer_sequence_scaled(customer_id, table_name)
        return {
            "customer_id": customer_id,
            "sequences": sequences,
            "labels": labels
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting customer sequence: {str(e)}")

@router.get("/progress/{task_id}")
async def get_progress(task_id: str, current_user: User = Depends(get_current_user)):
    """Get progress of a batch prediction task"""
    if task_id not in task_store:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = task_store[task_id]
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
    current_user: User = Depends(get_current_user)
):
    """Start batch churn prediction for all customers"""
    task_id = create_task()
    
    def run_prediction():
        try:
            df = get_all_customers_from_db(table_name)
            total_customers = len(df['Customer ID'].unique())
            update_task_progress(task_id, 0, total_customers)
            
            predictions = {}
            processed = 0
            
            for customer_id in df['Customer ID'].unique():
                # Convert numpy.int64 to Python int
                customer_id = int(customer_id)
                try:
                    result, label = predict_churn(customer_id, table_name)
                    predictions[customer_id] = {
                        "prediction": result,
                        "actual": label
                    }
                    processed += 1
                    update_task_progress(task_id, processed, total_customers)
                except Exception as e:
                    print(f"Error predicting for customer {customer_id}: {e}")
                    processed += 1
                    update_task_progress(task_id, processed, total_customers)
            
            complete_task(task_id, predictions)
        except Exception as e:
            fail_task(task_id, str(e))
    
    # Start prediction in background thread
    thread = threading.Thread(target=run_prediction)
    thread.start()
    
    return {"task_id": task_id, "message": "Batch prediction started"}

@router.get("/predict/{customer_id}")
async def predict_churn_single(
    customer_id: int, 
    current_user: User = Depends(get_current_user)
):
    """Predict churn for a single customer"""
    try:
        result, labels = predict_churn(customer_id, f"user_data_{current_user.id}")
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
    current_user: User = Depends(get_current_user)
):
    """Get all churned customers with predictions"""
    try:
        predictions = predict_churned_customers(table_name)
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting churned customers: {str(e)}") 