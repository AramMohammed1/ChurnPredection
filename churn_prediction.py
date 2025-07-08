import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import math
from sklearn.preprocessing import StandardScaler
import pickle
import pandas as pd

class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=10000):
        super(PositionalEncoding, self).__init__()
        
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)
        self.register_buffer('pe', pe)
        
    def forward(self, x):
        # x shape: (batch_size, seq_len, d_model)
        x = x + self.pe[:, :x.size(1), :]
        return x

class TransformerLayer(nn.Module):
    def __init__(self, d_model, num_heads, d_ff, dropout=0.1):
        super(TransformerLayer, self).__init__()
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        
        self.self_attn = nn.MultiheadAttention(d_model, num_heads, dropout=dropout)
        
        # Feed-forward network
        self.linear1 = nn.Linear(d_model, d_ff)
        self.linear2 = nn.Linear(d_ff, d_model)
        
    def forward(self, src):
        # src shape: (seq_len, batch_size, d_model)
        
        # Self-attention with residual connection
        src2 = self.norm1(src)
        attn_output, _ = self.self_attn(src2, src2, src2)
        src = src + (attn_output)
        
        # Feed-forward with residual connection
        src2 = self.norm2(src)
        src2 = self.linear2((F.relu(self.linear1(src2))))
        src = src + (src2)
        
        return src

class ChurnModel(nn.Module):
    def __init__(self, input_size, d_model=128, num_heads=8, d_ff=218, num_layers=2, output_size=1):
        super(ChurnModel, self).__init__()
        
        # Project input to model dimension
        self.embedding = nn.Linear(input_size, d_model)
        
        # Positional encoding
        self.pos_encoder = PositionalEncoding(d_model)
        
        # Transformer layers
        self.transformer_layers = nn.ModuleList([
            TransformerLayer(d_model, num_heads, d_ff) 
            for _ in range(num_layers)
        ])
        
        # Output layer
        self.fc = nn.Linear(d_model, d_model//2)
        self.output_layer = nn.Linear(d_model//2, output_size)
        
    def forward(self, x):
        # x shape: (batch_size, seq_len, input_size)
        
        # Reorder to (seq_len, batch_size, input_size)
        x = x.transpose(0, 1)
        
        # Project to d_model
        x = self.embedding(x)
        
        # Add positional encoding
        x = self.pos_encoder(x)
        
        # Pass through transformer layers
        for layer in self.transformer_layers:
            x = layer(x)
        
        # Get last time step (many-to-one)
        x = x[-1, :, :]  # (batch_size, d_model)
        
        # Output layer
        x = self.fc(x)
        output = self.output_layer(x)
        return torch.sigmoid(output)

# Input model for API validation - based on the actual features from working.ipynb
class ChurnPredictionInput(BaseModel):
    customer_id: Optional[int] = None
    
    # Sequence of customer behavior data (10 time steps)
    # Each time step contains these 14 features:
    # ['Product Price', 'Quantity', 'Total Purchase Amount', 'Returns', 'Age', 
    #  'Year', 'Month', 'Day', 'Gender_Male', 'Payment Method_Credit Card', 
    #  'Payment Method_PayPal', 'Product Category_Clothing', 'Product Category_Electronics', 'Product Category_Home']
    
    # For simplicity, we'll accept a flattened sequence (140 features total)
    # Users can provide either individual features or the full sequence
    sequence_data: Optional[List[float]] = None  # 140 features (10 * 14)
    
    # Individual features for single time step (if not providing sequence)
    product_price: Optional[float] = None
    quantity: Optional[int] = None
    total_purchase_amount: Optional[float] = None
    returns: Optional[float] = None
    age: Optional[int] = None
    year: Optional[int] = None
    month: Optional[int] = None
    day: Optional[int] = None
    gender_male: Optional[int] = None
    payment_method_credit_card: Optional[int] = None
    payment_method_paypal: Optional[int] = None
    product_category_clothing: Optional[int] = None
    product_category_electronics: Optional[int] = None
    product_category_home: Optional[int] = None

class ChurnPredictionResponse(BaseModel):
    customer_id: Optional[int]
    churn_probability: float
    churn_prediction: bool
    confidence: str



model = None
scaler = None
data_api = None
seq_length = 10
num_features = 14
input_size = 14  # Features per time step
d_model = 128
num_heads = 8
d_ff = 218
num_layers = 2


def load_model():
    """Load the trained model from best_model.pth"""
    global model, scaler
    
    try:
        # Load the model state
        checkpoint = torch.load('best_model.pth', map_location=torch.device('cpu'))
        
        # Extract model parameters
        if 'model_state_dict' in checkpoint:
            state_dict = checkpoint['model_state_dict']
        else:
            state_dict = checkpoint
            
        # Initialize model with the correct parameters from training
        model = ChurnModel(
            input_size=input_size,
            d_model=d_model,
            num_heads=num_heads,
            d_ff=d_ff,
            num_layers=num_layers,
            output_size=1
        )
        model.load_state_dict(state_dict)
        model.eval()
        
        # Try to load the scaler if it was saved
        try:
            with open('scaler.pkl', 'rb') as f:
                scaler = pickle.load(f)
            print("Scaler loaded successfully!")
        except FileNotFoundError:
            print("Warning: scaler.pkl not found. You may need to save the scaler from training.")
            scaler = None
        
        print(f"Model loaded successfully!")
        print(f"Sequence length: {seq_length}")
        print(f"Features per time step: {num_features}")
        print(f"Total input features: {seq_length * num_features}")
        
    except Exception as e:
        print(f"Error loading model: {e}")
        raise



def predict_churn(input_data: ChurnPredictionInput):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        # Prepare sequence data
        if len(input_data.sequence_data) != seq_length * num_features:
            raise HTTPException(
                status_code=400,
                detail=f"Expected {seq_length * num_features} features in sequence_data, got {len(input_data.sequence_data)}"
            )
        sequence = input_data.sequence_data
        # Reshape to (batch_size, seq_length, num_features)
        sequence_tensor = torch.tensor(sequence, dtype=torch.float32).reshape(1, seq_length, num_features)
        
        # Scale the data if scaler is available
        if scaler is not None:
            # Reshape for scaling: (batch_size * seq_length, num_features)
            sequence_reshaped = sequence_tensor.reshape(-1, num_features)
            # Scale the data
            sequence_scaled = scaler.transform(sequence_reshaped)
            # Reshape back to (batch_size, seq_length, num_features)
            sequence_tensor = torch.tensor(sequence_scaled, dtype=torch.float32).reshape(-1, seq_length, num_features)
        
        # Make prediction
        with torch.no_grad():
            prediction = model(sequence_tensor)
            churn_probability = prediction.item()
        
        # Determine churn prediction and confidence
        churn_prediction = churn_probability > 0.5
        
        if churn_probability > 0.8 or churn_probability < 0.2:
            confidence = "High"
        elif churn_probability > 0.6 or churn_probability < 0.4:
            confidence = "Medium"
        else:
            confidence = "Low"
        
        return ChurnPredictionResponse(
            customer_id=input_data.customer_id,
            churn_probability=round(churn_probability, 4),
            churn_prediction=churn_prediction,
            confidence=confidence
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
