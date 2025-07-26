import numpy as np
import pandas as pd
import torch
from fastapi import HTTPException
from ..utils.data_service import get_all_customers  # Use HTTP API
from .. import churn_service
from ..models.models import ChurnPredictionResponse
from ..domain.tasks import update_task_progress
import httpx
import os
import logging

numerical_cols = [
    'Product Price', 'Quantity', 'Total Purchase Amount', 'Returns', 'Age', 'Year', 'Month', 'Day',
    'Gender_Male', 'Payment Method_Credit Card', 'Payment Method_PayPal',
    'Product Category_Clothing', 'Product Category_Electronics', 'Product Category_Home'
]

async def get_customer_sequence_scaled(customer_id, table_name, access_token):
    customers = await get_all_customers(table_name, access_token)
    df = pd.DataFrame(customers)
    if hasattr(customer_id, 'item'):
        customer_id = customer_id.item()
    sequences = []
    labels = []
    seq_length = 10
    churn_offset = 1
    features = numerical_cols
    try:
        customer_data = df[df['Customer ID'] == customer_id].sort_values(by='Purchase Date')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"there is no dataframe")
    for i in range(max(1, len(customer_data) - seq_length + 1)):
        seq = customer_data.iloc[i:min(i + seq_length, len(customer_data))][features].values
        if len(seq) < seq_length:
            pad_shape = (seq_length - len(seq), len(features))
            padding = np.zeros(pad_shape)
            seq = np.vstack([seq, padding])
        if i + seq_length < len(customer_data) - churn_offset:
            label = 0
        else:
            label = customer_data.iloc[min(i + seq_length - 1, len(customer_data) - 1)]['Churn']
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

async def predict_churn(customer_id, table_name, access_token):
    customer_sequences, labels = await get_customer_sequence_scaled(customer_id, table_name, access_token)
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
            ))
    return result, labels

async def predict_churned_customers(table_name, access_token):
    customers = await get_all_customers(table_name, access_token)
    df = pd.DataFrame(customers)
    predictions = {}
    sum = 0
    for customer_id in df['Customer ID'].unique():
        customer_id = int(customer_id)
        result, label = await predict_churn(customer_id, table_name, access_token)
        predictions[customer_id] = {
            "prediction": result,
            "actual": label
        }
        if result[len(result) - 1].churn_prediction != label[len(label) - 1]:
            sum += 1
    print(f"{sum} out of {len(predictions)}")
    return predictions

async def get_all_customer_sequences_scaled(table_name, access_token):
    customers = await get_all_customers(table_name, access_token)
    import pandas as pd
    df = pd.DataFrame(customers)
    seq_length = 10
    churn_offset = 1
    features = numerical_cols
    all_sequences = {}
    for customer_id, customer_data in df.groupby('Customer ID'):
        customer_id = int(customer_id)
        customer_data = customer_data.sort_values(by='Purchase Date')
        sequences = []
        labels = []
        for i in range(max(1, len(customer_data) - seq_length + 1)):
            seq = customer_data.iloc[i:min(i + seq_length, len(customer_data))][features].values
            if len(seq) < seq_length:
                pad_shape = (seq_length - len(seq), len(features))
                padding = np.zeros(pad_shape)
                seq = np.vstack([seq, padding])
            if i + seq_length < len(customer_data) - churn_offset:
                label = 0
            else:
                label = customer_data.iloc[min(i + seq_length - 1, len(customer_data) - 1)]['Churn']
            sequences.append(seq)
            labels.append(label)
        X = np.array(sequences)
        y = np.array(labels)
        X = X.reshape(X.shape[0], -1)
        if churn_service.scaler is None:
            raise HTTPException(status_code=500, detail="Scaler not loaded")
        x_resampled = churn_service.scaler.transform(X)
        all_sequences[customer_id] = (x_resampled, y)
    return all_sequences

async def get_customers_in_batches(table_name, access_token, batch_size=1000):
    """Async generator to fetch customers in batches from the data service."""
    DATA_SERVICE_URL = os.getenv("DATA_SERVICE_URL", "http://localhost:8011")
    offset = 0
    while True:
        url = f"{DATA_SERVICE_URL}/data/customers/batch/{table_name}/?offset={offset}&limit={batch_size}"
        headers = {"Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                raise Exception(f"Data service error: {resp.status_code} {resp.text}")
            batch = resp.json()
            if not batch:
                break
            yield batch
            if len(batch) < batch_size:
                break
            offset += batch_size

async def predict_churn_batch(table_name, access_token, task_id=None, total_customers=None, batch_size=100):
    """
    Batch predict churn for all customers in the given table.
    Returns a dict: {customer_id: {"prediction": [...], "actual": [...]}}
    """
    if churn_service.model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    results = {}
    processed = 0
    errors = []
    async for batch in get_customers_in_batches(table_name, access_token, batch_size=batch_size):
        # Convert batch to DataFrame for compatibility
        import pandas as pd
        df = pd.DataFrame(batch)
        for customer_id, customer_data in df.groupby('Customer ID'):
            try:
                customer_id = int(customer_id)
                customer_data = customer_data.sort_values(by='Purchase Date')
                sequences = []
                labels = []
                seq_length = churn_service.seq_length
                features = numerical_cols
                churn_offset = 1
                for i in range(max(1, len(customer_data) - seq_length + 1)):
                    seq = customer_data.iloc[i:min(i + seq_length, len(customer_data))][features].values
                    if len(seq) < seq_length:
                        pad_shape = (seq_length - len(seq), len(features))
                        padding = np.zeros(pad_shape)
                        seq = np.vstack([seq, padding])
                    if i + seq_length < len(customer_data) - churn_offset:
                        label = 0
                    else:
                        label = customer_data.iloc[min(i + seq_length - 1, len(customer_data) - 1)]['Churn']
                    sequences.append(seq)
                    labels.append(label)
                X = np.array(sequences)
                y = np.array(labels)
                X = X.reshape(X.shape[0], -1)
                if churn_service.scaler is None:
                    raise HTTPException(status_code=500, detail="Scaler not loaded")
                x_resampled = churn_service.scaler.transform(X)
                if len(x_resampled[0]) != churn_service.seq_length * churn_service.num_features:
                    raise ValueError(f"Expected {churn_service.seq_length * churn_service.num_features} features in customer_sequence, got {len(x_resampled[0])}")
                sequence_tensor = torch.tensor(x_resampled, dtype=torch.float32).reshape(len(x_resampled), churn_service.seq_length, churn_service.num_features)
                customer_results = []
                with torch.no_grad():
                    predictions = churn_service.model(sequence_tensor)
                    for pred in predictions:
                        churn_probability = pred.item()
                        churn_prediction = churn_probability > 0.5
                        if churn_probability > 0.8 or churn_probability < 0.2:
                            confidence = "High"
                        elif churn_probability > 0.6 or churn_probability < 0.4:
                            confidence = "Medium"
                        else:
                            confidence = "Low"
                        customer_results.append(ChurnPredictionResponse(
                            customer_id=customer_id,
                            churn_probability=round(churn_probability, 4),
                            churn_prediction=churn_prediction,
                            confidence=confidence
                        ))
                results[customer_id] = {
                    "prediction": [result.dict() for result in customer_results],
                    "actual": y.tolist() if hasattr(y, 'tolist') else list(y)
                }
            except Exception as e:
                logging.exception(f"Error processing customer {customer_id}")
                errors.append(f"Customer {customer_id}: {str(e)}")
                continue
            processed += 1
            if task_id is not None and total_customers is not None:
                update_task_progress(task_id, processed, total_customers)
    if errors:
        raise Exception(f"Prediction failed for {len(errors)} customers. Example error: {errors[0] if errors else 'Unknown error'}")
    return results