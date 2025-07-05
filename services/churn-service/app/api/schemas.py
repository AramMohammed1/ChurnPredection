from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime


class HealthCheckResponse(BaseModel):
    """Health check response schema"""
    status: str
    message: str
    timestamp: datetime
    version: str


class CSVUploadResponse(BaseModel):
    """CSV upload response schema"""
    upload_id: int
    table_name: str
    filename: str
    row_count: int
    column_count: int
    status: str
    columns: List[str]
    data_types: Dict[str, str]


class UploadStatusResponse(BaseModel):
    """Upload status response schema"""
    id: int
    filename: str
    table_name: str
    row_count: int
    column_count: int
    status: str
    error_message: Optional[str] = None
    created_at: Optional[str] = None
    completed_at: Optional[str] = None


class UploadListResponse(BaseModel):
    """Upload list response schema"""
    id: int
    filename: str
    table_name: str
    row_count: int
    column_count: int
    status: str
    created_at: Optional[str] = None


class TableColumnInfo(BaseModel):
    """Table column information schema"""
    name: str
    type: str
    nullable: bool


class TableInfoResponse(BaseModel):
    """Table information response schema"""
    table_name: str
    columns: List[TableColumnInfo]
    row_count: int


class TableDataResponse(BaseModel):
    """Table data response schema"""
    data: List[Dict[str, Any]]
    total_rows: int
    limit: int


class ChurnPredictionRequest(BaseModel):
    """Churn prediction request schema"""
    customer_id: str = Field(..., description="Customer ID")
    prediction: float = Field(..., ge=0.0, le=1.0, description="Prediction value (0-1)")
    probability: float = Field(..., ge=0.0, le=1.0, description="Probability value (0-1)")
    features: Dict[str, Any] = Field(..., description="Feature values used for prediction")


class ChurnPredictionResponse(BaseModel):
    """Churn prediction response schema"""
    id: int
    customer_id: str
    prediction: float
    probability: float
    features: Dict[str, Any]
    created_at: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str
    message: str
    timestamp: datetime


class SuccessResponse(BaseModel):
    """Success response schema"""
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime 