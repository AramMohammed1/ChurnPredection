import pandas as pd
import numpy as np
import joblib
from fastapi import FastAPI,HTTPException
from . import models
from .database import engine
from .database.repositories import get_all_customers_from_db,get_customer,insert_csv_data_to_table
from . import churn_service
from .domain import get_customer_sequence_scaled, predict_churn, predict_churned_customers

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

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    models.Base.metadata.create_all(bind=engine)
    churn_service.load_model()
    
@app.post("/create_table")
async def create_table(table_name: str, csv_file_path: str):
    #
    # models.create_table_from_csv(csv_file_path, table_name, engine)
    insert_csv_data_to_table(csv_file_path, table_name, engine)
    return {"message": "Table created successfully"}


@app.get("/customers")
async def get_customers():
    """Get all customers"""
    df = pd.read_sql("SELECT * FROM ecommerce", engine)
    print(df.head())
    
    # Fill null values with appropriate strategies
    df = fill_nulls_with_mean(df)
    
    return df.to_dict('records')



@app.get("/customers/{table_name}/{customer_id}")
async def get_customer_by_id(customer_id: int,table_name:str):
    return get_customer(customer_id,table_name).to_dict('records')

@app.get("/customers/all/{table_name}/")
async def get_all_customers(table_name:str):
    return get_all_customers_from_db(table_name).to_dict('records')

@app.get("/Churns/")
def get_churned_customers(table_name):
    return predict_churned_customers(table_name)

@app.get("/customers/{table_name}/{customer_id}/sequence")
async def get_customer_sequence(customer_id: int, table_name: str):
    return get_customer_sequence_scaled(customer_id, table_name)

@app.get("/customers_predicts/{customer_id}")
async def predictChurn(customer_id: int):
    return predict_churn(customer_id, "ecommerce")
