import pandas as pd
from sqlalchemy.orm import Session
import torch
from sqlalchemy import text
from . import get_db,engine
import joblib
import numpy as np
from fastapi import HTTPException
from .. import churn_service
from ..churn_service import ChurnPredictionResponse



def get_customer (customer_id: int, table_name: str)->pd.DataFrame:
    """Get specific customer by ID"""
    # Convert numpy types to Python native types
    try:
        customer_id = int(customer_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail=f"Invalid customer_id: {customer_id}")
    
    query = f"SELECT * FROM {table_name} WHERE \"Customer ID\" = %(customer_id)s"
    df = pd.read_sql(query, engine, params={"customer_id": customer_id, "table_name": table_name})
    if df.empty:
        raise HTTPException(status_code=404, detail=f"customer {customer_id} not found")
    return df   
 
def get_all_customers_from_db(table_name:str)->pd.DataFrame:
    query = f"SELECT * FROM {table_name}"
    df = pd.read_sql(query,engine,params={"table_name": table_name})
    if df.empty:
        raise HTTPException(status_code=404,detail=f"table {table_name} not found")
    return df


def insert_csv_data_to_table(csv_file_path, table_name, engine, column_mapping=None):
    """ 
    Insert CSV data into the specified table (now used for per-user tables)
    """
    # Read CSV file
    data = pd.read_csv(csv_file_path, low_memory=False)
    # Apply column mapping if provided
    if column_mapping:
        # Create mapping dictionary - map user's column names to required system names
        mapping_dict = {
            column_mapping.customer_id: 'Customer ID',
            column_mapping.customer_name: 'Customer Name',
            column_mapping.purchase_date: 'Purchase Date',
            column_mapping.product_price: 'Product Price',
            column_mapping.quantity: 'Quantity',
            column_mapping.total_purchase_amount: 'Total Purchase Amount',
            column_mapping.returns: 'Returns',
            column_mapping.age: 'Age',
            column_mapping.gender: 'Gender',
            column_mapping.payment_method: 'Payment Method',
            column_mapping.product_category: 'Product Category',
            column_mapping.churn: 'Churn'
        }
        
        # Rename columns from user's names to system names
        data = data.rename(columns=mapping_dict)
    
    # Ensure all required columns exist
    required_columns = [
        'Customer ID', 'Customer Name', 'Purchase Date', 'Product Price', 'Quantity', 
        'Total Purchase Amount', 'Returns', 'Age', 'Gender', 'Payment Method', 
        'Product Category', 'Churn'
    ]    
    # Process the data
    data['Purchase Date'] = pd.to_datetime(data['Purchase Date'])
    data['Year'] = data['Purchase Date'].dt.year
    data['Month'] = data['Purchase Date'].dt.month
    data['Day'] = data['Purchase Date'].dt.day
    print("ok")

    # Convert numeric columns to proper types
    data['Age'] = pd.to_numeric(data['Age'], errors='coerce').fillna(30)
    data['Product Price'] = pd.to_numeric(data['Product Price'], errors='coerce').fillna(0)
    data['Quantity'] = pd.to_numeric(data['Quantity'], errors='coerce').fillna(1)
    data['Total Purchase Amount'] = pd.to_numeric(data['Total Purchase Amount'], errors='coerce').fillna(0)
    data['Returns'] = pd.to_numeric(data['Returns'], errors='coerce').fillna(0)
    data['Churn'] = pd.to_numeric(data['Churn'], errors='coerce').fillna(0)
    
    # One hot encoding for categorical columns
    categorical_columns = ['Gender', 'Payment Method', 'Product Category']
    data = pd.get_dummies(data, columns=categorical_columns, drop_first=True)

    # Convert boolean columns to float
    for col in data.columns:
        if data[col].dtype == bool:
            data[col] = data[col].astype(float)

    # Insert data into table
    data.to_sql(table_name, engine, if_exists='replace', index=False)
    
    print(f"Data inserted into table '{table_name}' successfully!")
    