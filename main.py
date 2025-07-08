import pandas as pd
import numpy as np
import joblib
from fastapi import FastAPI,HTTPException
from . import models
from .database import engine
from .domain import insert_csv_data_to_table,get_customer_data_pandas,get_customer_data
from sklearn.preprocessing import StandardScaler

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

@app.post("/create_table")
async def create_table(table_name: str, csv_file_path: str):
    #
    # models.create_table_from_csv(csv_file_path, table_name, engine)
    insert_csv_data_to_table(csv_file_path, table_name, engine)
    return {"message": "Table created successfully"}

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



def get_customer (customer_id: int, table_name: str)->pd.DataFrame:
    """Get specific customer by ID"""
    query = f"SELECT * FROM {table_name} WHERE \"Customer ID\" = %(customer_id)s"
    df = pd.read_sql(query, engine, params={"customer_id": customer_id, "table_name": table_name})
    if df.empty:
        raise HTTPException(status_code=404, detail=f"customer {customer_id} not found")

    return df

@app.get("/customers/{table_name}/{customer_id}")
async def get_customer_by_id(customer_id: int,table_name:str):
    return get_customer(customer_id,table_name).to_dict('records')


def pad_sequence(sequence, seq_length, pad_value=0):
    """Pad a sequence with pad_value if it's shorter than seq_length"""
    if len(sequence) >= seq_length:
        return sequence
    padding = np.array([pad_value] * (seq_length - len(sequence)))
    return np.concatenate([sequence, padding])





@app.get("/customers/{table_name}/{customer_id}/sequence")
async def get_customer_sequence(customer_id: int, table_name: str):
    numerical_cols =['Product Price', 'Quantity','Total Purchase Amount', 'Returns', 'Age', 'Year', 'Month', 'Day','Gender_Male', 'Payment Method_Credit Card', 'Payment Method_PayPal', 'Product Category_Clothing','Product Category_Electronics', 'Product Category_Home']
    df = get_customer(customer_id,table_name)
    sequences = []
    labels = []
    seq_length = 10
    churn_offset = 1 #when do we consider the customer seq as churn seq
    features = numerical_cols 

    try:
        customer_data = df[df['Customer ID'] == customer_id].sort_values(by='Purchase Date')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"there is no dataframe")
    
    for i in range(max(1,len(customer_data)-seq_length+1)):
        seq = customer_data.iloc[i:min(i+seq_length, len(customer_data))][features].values
        if len(seq) < seq_length:
            pad_shape = (seq_length - len(seq), len(features))
            padding = np.zeros(pad_shape)
            seq = np.vstack([seq, padding])
        if i + seq_length < len(customer_data) - churn_offset:
            label = 0
        else:
            label = customer_data.iloc[min(i+seq_length-1, len(customer_data)-1)]['Churn']
        sequences.append(seq)
        labels.append(label)

    print('-'*50 + 'sequences' + '-'*50)
    print(sequences)
    X = np.array(sequences)
    y = np.array(labels)
    print('-'*50 + 'X' + '-'*50)
    print(X)
    print("-"*100)
    print(X.shape, y.shape)
    X = X.reshape(X.shape[0], -1)  # (50792, 140)
    print('-'*50 + 'reshaped X' + '-'*50)
    print(X)
    print(X.shape)
    print("Unique values in X:", np.unique(X))

    print('-'*50 + 'scaled' + '-'*50)
    scaler = joblib.load("scaler.pkl")
    x_resampled = scaler.transform(X)  # never fit again!

    print(x_resampled)
    x_resampled = x_resampled.reshape(-1, seq_length, len(numerical_cols))
    print('-'*50 + 'reshaped' + '-'*50)
    print(x_resampled)
    print(x_resampled.shape)

    return x_resampled.tolist()





