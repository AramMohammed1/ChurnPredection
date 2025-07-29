from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class SegmentInfo(BaseModel):
    name: str
    description: str
    color: str
    count: int
    percentage: float
    avg_spent: float
    avg_quantity: float
    avg_age: float

class BehaviorAnalysis(BaseModel):
    segment: str
    purchases: float
    engagement: float
    avg_spent: float

class CustomerSegment(BaseModel):
    customer_id: int
    segment: int
    segment_name: str
    total_purchase_amount: float
    quantity: int
    returns: int
    age: int
    product_price: float

class SegmentationResponse(BaseModel):
    segments: Dict[str, SegmentInfo]
    behavior_analysis: List[BehaviorAnalysis]
    total_customers: int
    customer_data: List[Dict[str, Any]]

class SegmentCustomerRequest(BaseModel):
    table_name: str

class SegmentCustomerResponse(BaseModel):
    success: bool
    message: str
    data: Optional[SegmentationResponse] = None 