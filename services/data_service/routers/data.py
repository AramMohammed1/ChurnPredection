import os
import tempfile
import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import Optional
from ..database import engine
from ..database.repositories import get_all_customers_from_db, get_customer, insert_csv_data_to_table, save_upload_history, get_user_upload_history, get_customers_in_batches_from_db,create_user_prediction_table,get_customers_aggregated
from ..models.ColumnMapping import ColumnMapping
import requests
import json
from ..utils.auth import get_current_user
router = APIRouter(prefix="/data", tags=["data management"])

@router.post("/create_table")
async def create_table(csv_file_path: str, current_user: dict = Depends(get_current_user)):
    """Create a table from CSV file"""
    try:
        user_id = current_user["id"]
        table_name = f"user_data_{user_id}"
        insert_csv_data_to_table(csv_file_path, table_name, engine)
        return {"message": "Table created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating table: {str(e)}")

@router.post("/upload_csv")
async def upload_csv(
    file: UploadFile = File(...),
    table_name: str = Form(...),
    column_mapping_json: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a CSV file and insert it into the database with optional column mapping
    """
    try:
        user_id = current_user["id"]
    
        if not file.filename or not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed")

        column_mapping = None
        if column_mapping_json:
            try:
                column_mapping = ColumnMapping(**json.loads(column_mapping_json))
            except Exception as e:
                raise HTTPException(status_code=422, detail=f"Invalid column mapping format: {str(e)}")

       
        with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            table_name = f"user_data_{user_id}"
            records_count = insert_csv_data_to_table(temp_file_path, table_name, engine, column_mapping)
            create_user_prediction_table(user_id)   
            try:
                save_upload_history(
                    user_id=user_id,
                    filename=file.filename,
                    table_name=table_name,
                    status="success",
                    file_size=len(content),
                    records_count=records_count
                )
            except Exception as e:
                print(e)

            return {
                "message": "CSV file uploaded and processed successfully",
                "filename": file.filename,
                "table_name": table_name,
                "size": len(content),
                "records_count": records_count
            }
        except Exception as e:
            save_upload_history(
                user_id=user_id,
                filename=file.filename,
                table_name=table_name,
                status="error",
                file_size=len(content),
                error_message=str(e)
            )
            raise e
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV file: {str(e)}")

@router.get("/upload_history")
async def get_upload_history(
    limit: int = 5,
    current_user: dict = Depends(get_current_user)
):
    """
    Get upload history for the current user
    """
    try:
        user_id = current_user["id"]
        history = get_user_upload_history(user_id, limit)
        return {"upload_history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving upload history: {str(e)}")

@router.post("/validate_csv_columns")
async def validate_csv_columns(file: UploadFile = File(...)):
    """
    Validate CSV file and return available columns for mapping
    """
    try:
        if not file.filename or not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed")

        content = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            df = pd.read_csv(temp_file_path, nrows=0)
            columns = df.columns.tolist()

            return {
                "columns": columns,
                "filename": file.filename,
                "total_columns": len(columns)
            }
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV file: {str(e)}")

@router.post("/import_from_api")
async def import_from_api(
    api_endpoint: str = Form(...),
    api_key: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Import data from external API and insert it into the user's database table
    """
    try:
        user_id = current_user["id"]
        if not api_endpoint.startswith(('http://', 'https://')):
            raise HTTPException(status_code=400, detail="Invalid API endpoint URL")

        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

        try:
            response = requests.get(api_endpoint, headers=headers, timeout=30)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch data from API: {str(e)}")

        try:
            api_data = response.json()
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON response from API")

        if isinstance(api_data, list):
            df = pd.DataFrame(api_data)
        elif isinstance(api_data, dict) and 'data' in api_data:
            df = pd.DataFrame(api_data['data'])
        else:
            raise HTTPException(status_code=400, detail="API response should be a list of records or contain a 'data' field")

        if df.empty:
            raise HTTPException(status_code=400, detail="No data received from API")

        with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as temp_file:
            df.to_csv(temp_file.name, index=False)
            temp_file_path = temp_file.name

        try:
            table_name = f"user_data_{user_id}"

            records_count = insert_csv_data_to_table(temp_file_path, table_name, engine, None)

            save_upload_history(
                user_id=user_id,
                filename=f"API Import from {api_endpoint}",
                table_name=table_name,
                status="success",
                file_size=len(response.content),
                records_count=records_count
            )

            return {
                "message": "Data imported successfully from API",
                "source": api_endpoint,
                "table_name": table_name,
                "records_count": records_count,
                "size": len(response.content)
            }

        except Exception as e:
            save_upload_history(
                user_id=user_id,
                filename=f"API Import from {api_endpoint}",
                table_name=table_name,
                status="error",
                file_size=len(response.content),
                error_message=str(e)
            )
            raise e
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except Exception as e:
        if not isinstance(e, HTTPException):
            raise HTTPException(status_code=500, detail=f"Error importing data from API: {str(e)}")
        raise e

@router.get("/customers/{table_name}/{customer_id}")
async def get_customer_by_id(
    customer_id: int,
    table_name: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific customer by ID from specified table"""
    try:
        user_id = current_user["id"]
        return get_customer(customer_id, table_name).to_dict('records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching customer: {str(e)}")


@router.get("/customers/{table_name}/{customer_id}/data")
async def get_customer_aggregated_data(
    customer_id: int,
    table_name: str,
    current_user: dict = Depends(get_current_user)
):
    """Get aggregated customer data"""
    try:
        user_id = current_user["id"]
        x = get_customer(customer_id, table_name)
        totalSpent = 0
        for i in range(len(x)):
            totalSpent += x.iloc[i]['Product Price'] * x.iloc[i]['Quantity']

        return {
            "id": customer_id,
            "name": x.iloc[0]['Customer Name'] if len(x) > 0 else "Unknown",
            "email": x.iloc[0].get('Email', 'N/A') if len(x) > 0 else "N/A",
            "totalSpent": str(totalSpent),
            "last_purchase_date": str(x.iloc[-1]['Purchase Date']) if len(x) > 0 else "N/A"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching customer data: {str(e)}")

@router.get("/customers/all_agg/{table_name}/")
async def get_all_customers_agg(
    table_name: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all customers from specified table"""
    table_name = f"user_data_{current_user['id']}"
    try:
        return get_customers_aggregated(table_name).to_dict('records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching customers: {str(e)}") 

@router.get("/customers/all/{table_name}/")
async def get_all_customers(
    table_name: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all customers from specified table"""
    try:
        return get_all_customers_from_db(table_name).to_dict('records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching customers: {str(e)}") 

@router.get("/customers/batch/{table_name}/")
async def get_customers_batch(
    table_name: str,
    offset: int = 0,
    limit: int = 1000,
    current_user: dict = Depends(get_current_user)
):
    """Get a batch of customers from specified table (for streaming large datasets)"""
    try:
        batches = get_customers_in_batches_from_db(table_name, batch_size=limit)
        skipped = 0
        for batch in batches:
            batch_len = len(batch)
            if skipped + batch_len <= offset:
                skipped += batch_len
                continue
            start = max(0, offset - skipped)
            end = start + limit
            result = batch.iloc[start:end].to_dict('records')
            return result
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching customer batch: {str(e)}") 