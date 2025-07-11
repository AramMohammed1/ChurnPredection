import pandas as pd
from sqlalchemy.orm import Session
import torch
from sqlalchemy import text
from .database import get_db,engine
from .database.repositories import get_all_customers_from_db, get_customer
import joblib
import numpy as np
from fastapi import HTTPException
from . import churn_service
from .churn_service import ChurnPredictionResponse


def get_customer_sequence_scaled(customer_id, table_name):
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

    X = np.array(sequences)
    y = np.array(labels)
    X = X.reshape(X.shape[0], -1)
    if churn_service.scaler is None:
        raise HTTPException(status_code=500, detail="Scaler not loaded")
    x_resampled = churn_service.scaler.transform(X) #change the scaler for each model
    # x_resampled = x_resampled.reshape(-1, seq_length, len(numerical_cols))
    return x_resampled.tolist(),y.tolist()

def predict_churn(customer_id, table_name):
    customer_sequences , labels = get_customer_sequence_scaled(customer_id, table_name)
    if churn_service.model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    # Prepare sequence data
    if len(customer_sequences[0]) != churn_service.seq_length * churn_service.num_features:
        raise HTTPException(
            status_code=400,
            detail=f"Expected {churn_service.seq_length * churn_service.num_features} features in customer_sequence, got {len(customer_sequences[0])}"
        )
    sequences = customer_sequences
    # Reshape to (batch_size, seq_length, num_features)
    sequence_tensor = torch.tensor(sequences, dtype=torch.float32).reshape(len(sequences), churn_service.seq_length, churn_service.num_features)
        
    result = []
    # Make prediction
    with torch.no_grad():
        predictions = churn_service.model(sequence_tensor)
        for pred in predictions:
            churn_probability= pred.item()

            # Determine churn prediction and confidence
            churn_prediction = churn_probability > 0.5
        
            if churn_probability > 0.8 or churn_probability < 0.2:
                confidence = "High"
            elif churn_probability > 0.6 or churn_probability < 0.4:
                confidence = "Medium"
            else:
                confidence = "Low"

            result.append( ChurnPredictionResponse(
                customer_id=customer_id,
                churn_probability=round(churn_probability, 4),
                churn_prediction=churn_prediction,
                confidence=confidence
                )
            )
    return result , labels
    
def predict_churned_customers(table_name):
    df = get_all_customers_from_db(table_name)
    predictions = {}
    for customer_id in df['Customer ID']:
        result, label = predict_churn(customer_id, table_name)
        predictions[customer_id] = {
            "prediction": result,
            "actual": label
        }
    return predictions