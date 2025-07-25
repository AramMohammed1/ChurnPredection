import pandas as pd
from pydantic import BaseModel
from typing import List, Optional


class User(BaseModel):
    id: int
    username: str
    email: str
    created_at: Optional[str] = None
    is_deleted: Optional[bool] = None



class ChurnPredictionInput(BaseModel):
    customer_id: Optional[int] = None
    sequence_data: Optional[List[float]] = None  # 140 features (10 * 14)
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
