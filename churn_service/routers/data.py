import os
import tempfile
import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any
from ..database import engine, get_db
from ..database.repositories import get_all_customers_from_db, get_customer, insert_csv_data_to_table, save_upload_history, get_user_upload_history
from ..routers.auth import get_current_user
from ..models import User

router = APIRouter(prefix="/data", tags=["data management"])

# Pydantic models
class ColumnMapping(BaseModel):
    customer_id: str
    customer_name: str
    purchase_date: str
    product_price: str
    quantity: str
    total_purchase_amount: str
    returns: str
    age: str
    gender: str
    payment_method: str
    product_category: str
    churn: str

def fill_nulls_with_mean(df):
    """
    Fill null values in DataFrame with appropriate strategies:
    - Numeric columns: fill with mean
    - Categorical columns: fill with mode (most frequent value)
    - Boolean columns: fill with False
    """
    df = df.copy()
    
    for column in df.columns:
        if df[column].dtype in ['int64', 'float64']:
            # Numeric columns - fill with mean
            mean_value = df[column].mean()
            if pd.notna(mean_value):  # Check if mean is not NaN
                df[column] = df[column].fillna(mean_value)
            else:
                # If mean is NaN (all values are null), fill with 0
                df[column] = df[column].fillna(0)
        elif df[column].dtype == 'bool':
            # Boolean columns - fill with False
            df[column] = df[column].fillna(False)
        elif df[column].dtype == 'object':
            # Categorical columns - fill with mode (most frequent value)
            mode_value = df[column].mode()
            if len(mode_value) > 0:
                df[column] = df[column].fillna(mode_value[0])
            else:
                # If no mode (all values are unique), fill with 'Unknown'
                df[column] = df[column].fillna('Unknown')
    
    return df

@router.post("/create_table")
async def create_table(table_name: str, csv_file_path: str, current_user: User = Depends(get_current_user)):
    """Create a table from CSV file"""
    try:
        insert_csv_data_to_table(csv_file_path, table_name, engine)
        return {"message": "Table created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating table: {str(e)}")

@router.post("/upload_csv")
async def upload_csv(
    file: UploadFile = File(...), 
    table_name: str = Form(...),
    column_mapping_json: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a CSV file and insert it into the database with optional column mapping
    """
    try:
        # Validate file type
        if not file.filename or not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed")
        
        # Parse column mapping if provided
        column_mapping = None
        if column_mapping_json:
            try:
                import json
                column_mapping = ColumnMapping(**json.loads(column_mapping_json))
            except Exception as e:
                raise HTTPException(status_code=422, detail=f"Invalid column mapping format: {str(e)}")
        
        # Create a temporary file to store the uploaded CSV
        with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as temp_file:
            # Read the uploaded file content
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            table_name = f"user_data_{current_user.id}"
            # Insert the CSV data into the database with column mapping
            records_count = insert_csv_data_to_table(temp_file_path, table_name, engine, column_mapping)
            
            # Save successful upload to history
            save_upload_history(
                user_id=current_user.id,
                filename=file.filename,
                table_name=table_name,
                status="success",
                file_size=len(content),
                records_count=records_count
            )
            
            return {
                "message": "CSV file uploaded and processed successfully",
                "filename": file.filename,
                "table_name": table_name,
                "size": len(content),
                "records_count": records_count
            }
        except Exception as e:
            # Save failed upload to history
            save_upload_history(
                user_id=current_user.id,
                filename=file.filename,
                table_name=table_name,
                status="error",
                file_size=len(content),
                error_message=str(e)
            )
            raise e
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV file: {str(e)}")

@router.get("/upload_history")
async def get_upload_history(
    current_user: User = Depends(get_current_user),
    limit: int = 5
):
    """
    Get upload history for the current user
    """
    try:
        history = get_user_upload_history(current_user.id, limit)
        return {"upload_history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving upload history: {str(e)}")

@router.post("/validate_csv_columns")
async def validate_csv_columns(file: UploadFile = File(...)):
    """
    Validate CSV file and return available columns for mapping
    """
    try:
        # Validate file type
        if not file.filename or not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed")
        
        # Read CSV headers
        content = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Read just the headers
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

@router.get("/customers")
async def get_customers(current_user: User = Depends(get_current_user)):
    """Get all customers from default table"""
    try:
        df = pd.read_sql("SELECT * FROM ecommerce", engine)
        # Fill null values with appropriate strategies
        df = fill_nulls_with_mean(df)
        return df.to_dict('records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching customers: {str(e)}")

@router.get("/customers/{table_name}/{customer_id}")
async def get_customer_by_id(
    customer_id: int, 
    table_name: str, 
    current_user: User = Depends(get_current_user)
):
    """Get specific customer by ID from specified table"""
    try:
        return get_customer(customer_id, table_name).to_dict('records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching customer: {str(e)}")

@router.get("/customers/{table_name}/{customer_id}/data")
async def get_customer_aggregated_data(
    customer_id: int, 
    table_name: str, 
    current_user: User = Depends(get_current_user)
):
    """Get aggregated customer data"""
    try:
        x = get_customer(customer_id, table_name)
        totalSpent = 0
        # Calculate total spent
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

@router.get("/customers/all/{table_name}/")
async def get_all_customers(
    table_name: str, 
    current_user: User = Depends(get_current_user)
):
    """Get all customers from specified table"""
    try:
        return get_all_customers_from_db(table_name).to_dict('records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching customers: {str(e)}") 