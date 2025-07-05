from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
import pandas as pd
import logging
import json
from datetime import datetime
import re

from ..infrastructure.repositories import DataUploadRepository, CSVDataRepository, ChurnPredictionRepository

logger = logging.getLogger(__name__)


class CSVUploadService:
    """Service for handling CSV upload operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.upload_repo = DataUploadRepository(db)
        self.csv_repo = CSVDataRepository(db)
    
    def upload_csv_file(self, file_content: bytes, filename: str, table_name: Optional[str] = None) -> Dict[str, Any]:
        """Upload and process CSV file"""
        try:
            # Generate table name if not provided
            if not table_name:
                table_name = self._generate_table_name(filename)
            
            # Read CSV data
            csv_data = pd.read_csv(pd.io.common.BytesIO(file_content))
            
            # Validate CSV data
            if csv_data.empty:
                raise ValueError("CSV file is empty")
            
            # Create upload record
            upload_record = self.upload_repo.create_upload_record(
                filename=filename,
                table_name=table_name,
                row_count=len(csv_data),
                column_count=len(csv_data.columns)
            )
            
            # Update status to processing
            self.upload_repo.update_upload_status(upload_record.id, "processing")
            
            # Create table from CSV structure
            if not self.csv_repo.create_table_from_csv(csv_data, table_name):
                self.upload_repo.update_upload_status(
                    upload_record.id, 
                    "failed", 
                    "Failed to create table"
                )
                raise Exception("Failed to create table")
            
            # Insert data into table
            if not self.csv_repo.insert_csv_data(csv_data, table_name):
                self.upload_repo.update_upload_status(
                    upload_record.id, 
                    "failed", 
                    "Failed to insert data"
                )
                raise Exception("Failed to insert data")
            
            # Update status to completed
            self.upload_repo.update_upload_status(upload_record.id, "completed")
            
            return {
                "upload_id": upload_record.id,
                "table_name": table_name,
                "filename": filename,
                "row_count": len(csv_data),
                "column_count": len(csv_data.columns),
                "status": "completed",
                "columns": list(csv_data.columns),
                "data_types": csv_data.dtypes.to_dict()
            }
            
        except Exception as e:
            logger.error(f"Error uploading CSV file: {e}")
            if 'upload_record' in locals():
                self.upload_repo.update_upload_status(
                    upload_record.id, 
                    "failed", 
                    str(e)
                )
            raise
    
    def _generate_table_name(self, filename: str) -> str:
        """Generate a valid table name from filename"""
        # Remove file extension
        name = filename.rsplit('.', 1)[0]
        
        # Replace invalid characters with underscores
        name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
        
        # Ensure it starts with a letter
        if name and not name[0].isalpha():
            name = 'table_' + name
        
        # Add timestamp to ensure uniqueness
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{name}_{timestamp}"
    
    def get_upload_status(self, upload_id: int) -> Optional[Dict[str, Any]]:
        """Get upload status by ID"""
        upload_record = self.upload_repo.get_upload_by_id(upload_id)
        if not upload_record:
            return None
        
        return {
            "id": upload_record.id,
            "filename": upload_record.filename,
            "table_name": upload_record.table_name,
            "row_count": upload_record.row_count,
            "column_count": upload_record.column_count,
            "status": upload_record.upload_status,
            "error_message": upload_record.error_message,
            "created_at": upload_record.created_at.isoformat() if upload_record.created_at else None,
            "completed_at": upload_record.completed_at.isoformat() if upload_record.completed_at else None
        }
    
    def get_all_uploads(self) -> List[Dict[str, Any]]:
        """Get all upload records"""
        uploads = self.upload_repo.get_all_uploads()
        return [
            {
                "id": upload.id,
                "filename": upload.filename,
                "table_name": upload.table_name,
                "row_count": upload.row_count,
                "column_count": upload.column_count,
                "status": upload.upload_status,
                "created_at": upload.created_at.isoformat() if upload.created_at else None
            }
            for upload in uploads
        ]


class DataManagementService:
    """Service for data management operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.csv_repo = CSVDataRepository(db)
    
    def get_table_info(self, table_name: str) -> Optional[Dict[str, Any]]:
        """Get information about a table"""
        return self.csv_repo.get_table_info(table_name)
    
    def get_table_data(self, table_name: str, limit: int = 100) -> Optional[List[Dict[str, Any]]]:
        """Get data from a table"""
        return self.csv_repo.get_table_data(table_name, limit)
    
    def list_all_tables(self) -> List[Dict[str, Any]]:
        """List all tables in the database"""
        try:
            result = self.db.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """)
            
            tables = []
            for row in result:
                table_name = row[0]
                table_info = self.get_table_info(table_name)
                if table_info:
                    tables.append(table_info)
            
            return tables
        except Exception as e:
            logger.error(f"Error listing tables: {e}")
            return []


class ChurnPredictionService:
    """Service for churn prediction operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.prediction_repo = ChurnPredictionRepository(db)
    
    def create_prediction(self, customer_id: str, prediction: float, probability: float, features: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new churn prediction"""
        try:
            features_json = json.dumps(features)
            prediction_record = self.prediction_repo.create_prediction(
                customer_id=customer_id,
                prediction=prediction,
                probability=probability,
                features=features_json
            )
            
            return {
                "id": prediction_record.id,
                "customer_id": prediction_record.customer_id,
                "prediction": prediction_record.prediction,
                "probability": prediction_record.probability,
                "features": json.loads(prediction_record.features),
                "created_at": prediction_record.created_at.isoformat() if prediction_record.created_at else None
            }
        except Exception as e:
            logger.error(f"Error creating prediction: {e}")
            raise
    
    def get_customer_predictions(self, customer_id: str) -> List[Dict[str, Any]]:
        """Get predictions for a specific customer"""
        predictions = self.prediction_repo.get_predictions_by_customer(customer_id)
        return [
            {
                "id": pred.id,
                "customer_id": pred.customer_id,
                "prediction": pred.prediction,
                "probability": pred.probability,
                "features": json.loads(pred.features) if pred.features else {},
                "created_at": pred.created_at.isoformat() if pred.created_at else None
            }
            for pred in predictions
        ]
    
    def get_all_predictions(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all predictions with limit"""
        predictions = self.prediction_repo.get_all_predictions(limit)
        return [
            {
                "id": pred.id,
                "customer_id": pred.customer_id,
                "prediction": pred.prediction,
                "probability": pred.probability,
                "features": json.loads(pred.features) if pred.features else {},
                "created_at": pred.created_at.isoformat() if pred.created_at else None
            }
            for pred in predictions
        ] 