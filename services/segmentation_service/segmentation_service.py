import joblib
import os
import numpy as np
import pandas as pd
from typing import List, Dict, Any
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import logging

# Global variables to store the loaded model and scaler
model = None
scaler = None
segment_names = {
    0: "Champions",
    1: "Loyal Customers", 
    2: "Potential Loyalists",
    3: "At Risk",
    4: "New Customers",
    5: "Need Attention"
}

segment_descriptions = {
    0: "High value, highly engaged customers with frequent purchases",
    1: "Regular purchasers with good engagement",
    2: "Recent customers with potential for growth",
    3: "Declining engagement, at risk of churning",
    4: "Recent first-time buyers",
    5: "Customers with bad engagmement"
}

segment_colors = {
    0: "#10B981",  # Green
    1: "#3B82F6",  # Blue
    2: "#8B5CF6",  # Purple
    3: "#F44336",  # Red
    4: "#06B6D4",  # Cyan
    5: "#F59E0B",  # Orange
}

def load_model():
    """Load the K-means model and scaler from the utils directory"""
    global model, scaler
    
    try:
        # Get the directory where this file is located
        current_dir = os.path.dirname(os.path.abspath(__file__))
        utils_dir = os.path.join(current_dir, "utils")
        
        # Load the K-means model
        model_path = os.path.join(utils_dir, "kmeans.pkl")
        if os.path.exists(model_path):
            model = joblib.load(model_path)
            print(f"K-means model loaded from {model_path}")
        else:
            print(f"Model file not found at {model_path}")
            return False
        
        # Load the scaler
        scaler_path = os.path.join(utils_dir, "scaler.pkl")
        if os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
            print(f"Scaler loaded from {scaler_path}")
        else:
            print(f"Scaler file not found at {scaler_path}")
            return False
            
        return True
        
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        return False

def prepare_features(customer_data: pd.DataFrame) -> np.ndarray:
    """Prepare features for segmentation from customer data"""
    # Define the features used for segmentation
    feature_columns = [
        'Total Purchase Amount',
        'Quantity', 
        'Age',
    ]
    
    # Select only the features we need
    features = customer_data[feature_columns].copy()
    
    # Handle missing values
    features = features.fillna(0)
    
    # Convert to numpy array
    feature_array = features.values
    
    return feature_array

def segment_customers(customer_data: pd.DataFrame) -> Dict[str, Any]:
    """Segment customers using the loaded K-means model"""
    global model, scaler
    
    if model is None or scaler is None:
        raise Exception("Model or scaler not loaded")
    
    # Prepare features
    features = prepare_features(customer_data)
    
    # Scale the features
    features_scaled = scaler.transform(features)
    
    # Predict segments
    segments = model.predict(features_scaled)
    
    # Add segment labels to the dataframe
    customer_data['segment'] = segments
    customer_data['segment_name'] = customer_data['segment'].map(segment_names)
    
    # Calculate segment statistics
    segment_stats = {}
    total_customers = len(customer_data)
    
    for segment_id in range(len(segment_names)):
        segment_customers = customer_data[customer_data['segment'] == segment_id]
        count = len(segment_customers)
        
        if count > 0:
            avg_spent = segment_customers['Total Purchase Amount'].mean()
            avg_quantity = segment_customers['Quantity'].mean()
            avg_age = segment_customers['Age'].mean()
            
            segment_stats[segment_id] = {
                'name': segment_names[segment_id],
                'description': segment_descriptions[segment_id],
                'color': segment_colors[segment_id],
                'count': count,
                'percentage': round((count / total_customers) * 100, 1),
                'avg_spent': round(avg_spent, 2),
                'avg_quantity': round(avg_quantity, 2),
                'avg_age': round(avg_age, 1)
            }
    
    return {
        'segments': segment_stats,
        'customer_data': customer_data.to_dict('records'),
        'total_customers': total_customers
    }

def get_segment_behavior_analysis(customer_data: pd.DataFrame) -> List[Dict[str, Any]]:
    """Analyze behavior patterns for each segment"""
    behavior_data = []
    
    for segment_id in range(5):
        segment_customers = customer_data[customer_data['segment'] == segment_id]
        
        if len(segment_customers) > 0:
            # Calculate behavioral metrics
            avg_purchases = segment_customers.groupby('Customer ID').size().mean()
            avg_spent = segment_customers['Total Purchase Amount'].mean()
            engagement_score = calculate_engagement_score(segment_customers)
            satisfaction_score = calculate_satisfaction_score(segment_customers)
            
            behavior_data.append({
                'segment': segment_names[segment_id],
                'purchases': round(avg_purchases, 1),
                'engagement': round(engagement_score, 1),
                'satisfaction': round(satisfaction_score, 1),
                'avg_spent': round(avg_spent, 2)
            })
    
    return behavior_data

def calculate_engagement_score(segment_data: pd.DataFrame) -> float:
    """Calculate engagement score based on purchase frequency and recency"""
    if len(segment_data) == 0:
        return 0
    
    # Simple engagement score based on purchase frequency
    customers = segment_data['Customer ID'].nunique()
    total_purchases = len(segment_data)
    
    if customers == 0:
        return 0
    
    # Engagement score: purchases per customer (normalized to 0-100)
    engagement = (total_purchases / customers) * 10  # Scale factor
    return min(engagement, 100)

def calculate_satisfaction_score(segment_data: pd.DataFrame) -> float:
    """Calculate satisfaction score based on returns and purchase amounts"""
    if len(segment_data) == 0:
        return 0
    
    # Calculate return rate
    total_purchases = len(segment_data)
    total_returns = segment_data['Returns'].sum()
    return_rate = (total_returns / total_purchases) if total_purchases > 0 else 0
    
    # Calculate average purchase amount
    avg_purchase = segment_data['Total Purchase Amount'].mean()
    
    # Satisfaction score: higher for lower return rates and higher purchase amounts
    satisfaction = (1 - return_rate) * 50 + (avg_purchase / 100) * 50
    return min(satisfaction, 100) 