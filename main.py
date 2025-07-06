import pandas as pd
from fastapi import FastAPI
from . import models
from .database import engine
from .domain import insert_csv_data_to_table,get_customer_data_pandas,get_customer_data

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
    models.create_table_from_csv('ecommerce_customer_data_large.csv', 'customer_data', engine)
    insert_csv_data_to_table('ecommerce_customer_data_large.csv', 'customer_data', engine)

@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}

@app.get("/data/")
async def get_data():
    return get_customer_data()

@app.get("/data/pandas")
async def get_data_pandas():
    return get_customer_data_pandas()

@app.get("/customers")
async def get_customers():
    """Get all customers"""
    df = pd.read_sql("SELECT * FROM customer_data", engine)
    print(df.head())
    
    # Fill null values with appropriate strategies
    df = fill_nulls_with_mean(df)
    
    return df.to_dict('records')

@app.get("/customers/{customer_id}")
async def get_customer(customer_id: int):
    """Get specific customer by ID"""
    query = "SELECT * FROM customer_data WHERE \"Customer ID\" = %(customer_id)s"
    df = pd.read_sql(query, engine, params={"customer_id": customer_id})
    if df.empty:
        return {"error": "Customer not found"}
    
    # Fill null values with appropriate strategies
    df = fill_nulls_with_mean(df)
    return df.to_dict('records')

@app.get("/customers/churn/{churn_status}")
async def get_customers_by_churn(churn_status: int):
    """Get customers by churn status"""
    query = "SELECT * FROM customer_data WHERE \"Churn\" = %(churn)s"
    df = pd.read_sql(query, engine, params={"churn": churn_status})
    
    # Fill null values with appropriate strategies
    df = fill_nulls_with_mean(df)
    
    return df.to_dict('records')