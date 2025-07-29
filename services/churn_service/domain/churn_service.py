import os
from tkinter import W
import torch
import torch.nn as nn
import torch.nn.functional as F
from fastapi import FastAPI, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from sklearn.preprocessing import StandardScaler
import joblib
import math
import pandas as pd
import numpy as np
from dotenv import load_dotenv
load_dotenv()

churn_model_path = os.getenv("CHURN_MODEL_PATH","")
scaler_path = os.getenv("CHURN_SCALER_PATH","")

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
        # Try to load the scaler if it was saved
    try:
        # scaler = joblib.load(scaler_path)
        scaler = joblib.load("services\\churn_service\\utils\\scaler.pkl")

        print(scaler)
        print("Scaler loaded successfully!")
        
    except FileNotFoundError:
        print("Error: scaler.pkl not found. You may need to save the scaler from training.")
        scaler = None

    try:
        # Load the model state
        # checkpoint = torch.load('services\\churn_service\\utils\\best_model.pth', map_location=torch.device('cpu'))
       
        checkpoint = torch.load('services\\churn_service\\utils\\best_model.pth', map_location=torch.device('cpu'))
        
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
        with torch.no_grad():
            model.load_state_dict(state_dict)
            model.eval()
        
    except Exception as e:
        print(f"Error loading model: {e}")
        raise



