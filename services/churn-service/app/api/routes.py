from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from datetime import datetime

from .schemas import (
    HealthCheckResponse, CSVUploadResponse, UploadStatusResponse, UploadListResponse,
    TableInfoResponse, TableDataResponse, ChurnPredictionRequest, ChurnPredictionResponse,
    ErrorResponse, SuccessResponse
)
from ..infrastructure.database import get_db
from ..application.services import CSVUploadService, DataManagementService, ChurnPredictionService
from ..infrastructure.config import settings

logger = logging.getLogger(__name__)

# Create router
router = APIRouter()


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    return HealthCheckResponse(
        status="healthy",
        message="Churn Prediction Service is running",
        timestamp=datetime.utcnow(),
        version=settings.app_version
    )


@router.post("/upload/csv", response_model=CSVUploadResponse)
async def upload_csv(
    file: UploadFile = File(..., description="CSV file to upload"),
    table_name: Optional[str] = Query(None, description="Custom table name (optional)"),
    db: Session = Depends(get_db)
):
    """Upload CSV file and create table with data"""
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be a CSV file")
        
        # Read file content
        file_content = await file.read()
        
        # Process CSV upload
        upload_service = CSVUploadService(db)
        result = upload_service.upload_csv_file(file_content, file.filename, table_name)
        
        return CSVUploadResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in CSV upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/upload/{upload_id}/status", response_model=UploadStatusResponse)
async def get_upload_status(upload_id: int, db: Session = Depends(get_db)):
    """Get upload status by ID"""
    try:
        upload_service = CSVUploadService(db)
        result = upload_service.get_upload_status(upload_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Upload not found")
        
        return UploadStatusResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting upload status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/uploads", response_model=List[UploadListResponse])
async def get_all_uploads(db: Session = Depends(get_db)):
    """Get all upload records"""
    try:
        upload_service = CSVUploadService(db)
        uploads = upload_service.get_all_uploads()
        
        return [UploadListResponse(**upload) for upload in uploads]
        
    except Exception as e:
        logger.error(f"Error getting uploads: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tables", response_model=List[TableInfoResponse])
async def list_all_tables(db: Session = Depends(get_db)):
    """List all tables in the database"""
    try:
        data_service = DataManagementService(db)
        tables = data_service.list_all_tables()
        
        return [TableInfoResponse(**table) for table in tables]
        
    except Exception as e:
        logger.error(f"Error listing tables: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tables/{table_name}/info", response_model=TableInfoResponse)
async def get_table_info(table_name: str, db: Session = Depends(get_db)):
    """Get information about a specific table"""
    try:
        data_service = DataManagementService(db)
        table_info = data_service.get_table_info(table_name)
        
        if not table_info:
            raise HTTPException(status_code=404, detail="Table not found")
        
        return TableInfoResponse(**table_info)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting table info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tables/{table_name}/data", response_model=TableDataResponse)
async def get_table_data(
    table_name: str,
    limit: int = Query(100, ge=1, le=1000, description="Number of rows to return"),
    db: Session = Depends(get_db)
):
    """Get data from a specific table"""
    try:
        data_service = DataManagementService(db)
        data = data_service.get_table_data(table_name, limit)
        
        if data is None:
            raise HTTPException(status_code=404, detail="Table not found")
        
        return TableDataResponse(
            data=data,
            total_rows=len(data),
            limit=limit
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting table data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predictions", response_model=ChurnPredictionResponse)
async def create_prediction(
    prediction_request: ChurnPredictionRequest,
    db: Session = Depends(get_db)
):
    """Create a new churn prediction"""
    try:
        prediction_service = ChurnPredictionService(db)
        result = prediction_service.create_prediction(
            customer_id=prediction_request.customer_id,
            prediction=prediction_request.prediction,
            probability=prediction_request.probability,
            features=prediction_request.features
        )
        
        return ChurnPredictionResponse(**result)
        
    except Exception as e:
        logger.error(f"Error creating prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predictions/customer/{customer_id}", response_model=List[ChurnPredictionResponse])
async def get_customer_predictions(customer_id: str, db: Session = Depends(get_db)):
    """Get predictions for a specific customer"""
    try:
        prediction_service = ChurnPredictionService(db)
        predictions = prediction_service.get_customer_predictions(customer_id)
        
        return [ChurnPredictionResponse(**pred) for pred in predictions]
        
    except Exception as e:
        logger.error(f"Error getting customer predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predictions", response_model=List[ChurnPredictionResponse])
async def get_all_predictions(
    limit: int = Query(100, ge=1, le=1000, description="Number of predictions to return"),
    db: Session = Depends(get_db)
):
    """Get all predictions with limit"""
    try:
        prediction_service = ChurnPredictionService(db)
        predictions = prediction_service.get_all_predictions(limit)
        
        return [ChurnPredictionResponse(**pred) for pred in predictions]
        
    except Exception as e:
        logger.error(f"Error getting predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 