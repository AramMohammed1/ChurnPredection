import uuid
import json
import logging

# Try to use Redis, fallback to in-memory if not available
try:
    import redis
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    # Test connection
    redis_client.ping()
    USE_REDIS = True
    print("✅ Redis connected successfully")
except Exception as e:
    print(f"⚠️ Redis not available: {e}")
    print("🔄 Falling back to in-memory storage")
    USE_REDIS = False
    # Fallback to in-memory storage
    task_store = {}

def _task_key(task_id: str) -> str:
    return f"churn_task:{task_id}"

def create_task() -> str:
    """Create a new task and return its ID"""
    task_id = str(uuid.uuid4())
    task_data = {
        "processed": 0,
        "total": 0,
        "status": "in_progress",
        "result": None,
        "error": None
    }
    if USE_REDIS:
        redis_client.set(_task_key(task_id), json.dumps(task_data))
    else:
        task_store[task_id] = task_data
    return task_id

def update_task_progress(task_id: str, processed: int, total: int, status: str = "in_progress"):
    """Update task progress"""
    if USE_REDIS:
        key = _task_key(task_id)
        task_data = redis_client.get(key)
        if task_data:
            task_data = json.loads(task_data)
            task_data.update({
                "processed": processed,
                "total": total,
                "status": status
            })
            redis_client.set(key, json.dumps(task_data))
    else:
        if task_id in task_store:
            task_store[task_id].update({
                "processed": processed,
                "total": total,
                "status": status
            })

def complete_task(task_id: str, result, status: str = "done"):
    """Mark task as complete with result"""
    if USE_REDIS:
        key = _task_key(task_id)
        task_data = redis_client.get(key)
        if task_data:
            task_data = json.loads(task_data)
            task_data.update({
                "status": status,
                "result": result
            })
            redis_client.set(key, json.dumps(task_data))
    else:
        if task_id in task_store:
            task_store[task_id].update({
                "status": status,
                "result": result
            })

def fail_task(task_id: str, error: str):
    """Mark task as failed"""
    if USE_REDIS:
        key = _task_key(task_id)
        task_data = redis_client.get(key)
        if task_data:
            task_data = json.loads(task_data)
            task_data.update({
                "status": "failed",
                "error": error
            })
            redis_client.set(key, json.dumps(task_data))
    else:
        if task_id in task_store:
            task_store[task_id].update({
                "status": "failed",
                "error": error
            })

def cancel_task(task_id: str):
    """Cancel a running task"""
    if USE_REDIS:
        key = _task_key(task_id)
        task_data = redis_client.get(key)
        if task_data:
            task_data = json.loads(task_data)
            task_data.update({
                "status": "cancelled",
                "error": "Task was cancelled by user"
            })
            redis_client.set(key, json.dumps(task_data))
            return True
    else:
        if task_id in task_store:
            task_store[task_id].update({
                "status": "cancelled",
                "error": "Task was cancelled by user"
            })
            return True
    return False

def get_task(task_id: str):
    if USE_REDIS:
        key = _task_key(task_id)
        task_data = redis_client.get(key)
        if task_data:
            return json.loads(task_data)
    else:
        return task_store.get(task_id)
    return None
