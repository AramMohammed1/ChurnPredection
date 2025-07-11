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
    query = f"SELECT * FROM {table_name} WHERE \"Customer ID\" = %(customer_id)s"
    df = pd.read_sql(query, engine, params={"customer_id": customer_id, "table_name": table_name})
    if df.empty:
        raise HTTPException(status_code=404, detail=f"customer {customer_id} not found")
    return df   
 
def get_all_customers_from_db(table_name:str)->pd.DataFrame:
    query = f"SELECT DISTINCT \"Customer ID\" FROM {table_name}"
    df = pd.read_sql(query,engine,params={"table_name": table_name})
    if df.empty:
        raise HTTPException(status_code=404,detail=f"table {table_name} not found")
    return df


def insert_csv_data_to_table(csv_file_path, table_name, engine):
    """
    Insert CSV data into the created table
    """
    # Read CSV file
    data = pd.read_csv(csv_file_path)
    data['Purchase Date'] = pd.to_datetime(data['Purchase Date'])
    data['Year'] = data['Purchase Date'].dt.year
    data['Month'] = data['Purchase Date'].dt.month
    data['Day']=data['Purchase Date'].dt.day

    categorical_column = data.select_dtypes(include=['object']).columns

    # One hot encoding
    data = pd.get_dummies(data,columns=['Gender','Payment Method','Product Category'],drop_first=True)


    data.update(data[['Returns']].fillna(data['Returns'].mode()[0]))

    for col in data.columns:
        if data[col].dtype == bool:
            data[col] = data[col].astype(float)

    # Insert data into table
    data.to_sql(table_name, engine, if_exists='replace', index=False)
    
    print(f"Data inserted into table '{table_name}' successfully!")
    