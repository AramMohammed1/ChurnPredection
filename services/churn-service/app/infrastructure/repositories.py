from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional
import pandas as pd
import logging
from datetime import datetime

from ..domain.models import DataUpload, ChurnPrediction, CSVData

logger = logging.getLogger(__name__)


class DataUploadRepository:
    """Repository for data upload operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_upload_record(self, filename: str, table_name: str, row_count: int, column_count: int) -> DataUpload:
        """Create a new upload record"""
        upload_record = DataUpload(
            filename=filename,
            table_name=table_name,
            row_count=row_count,
            column_count=column_count,
            upload_status="pending"
        )
        self.db.add(upload_record)
        self.db.commit()
        self.db.refresh(upload_record)
        return upload_record
    
    def update_upload_status(self, upload_id: int, status: str, error_message: Optional[str] = None):
        """Update upload status"""
        upload_record = self.db.query(DataUpload).filter(DataUpload.id == upload_id).first()
        if upload_record:
            upload_record.upload_status = status
            upload_record.error_message = error_message
            if status in ["completed", "failed"]:
                upload_record.completed_at = datetime.utcnow()
            self.db.commit()
    
    def get_upload_by_id(self, upload_id: int) -> Optional[DataUpload]:
        """Get upload record by ID"""
        return self.db.query(DataUpload).filter(DataUpload.id == upload_id).first()
    
    def get_all_uploads(self) -> List[DataUpload]:
        """Get all upload records"""
        return self.db.query(DataUpload).order_by(DataUpload.created_at.desc()).all()


class CSVDataRepository:
    """Repository for CSV data operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_table_from_csv(self, csv_data: pd.DataFrame, table_name: str) -> bool:
        """Create a table dynamically from CSV data"""
        try:
            # Create dynamic table model
            dynamic_table = CSVData.create_table_from_csv(self.db.bind, csv_data, table_name)
            
            # Create the table in database
            dynamic_table.__table__.create(self.db.bind, checkfirst=True)
            
            logger.info(f"Table '{table_name}' created successfully")
            return True
        except Exception as e:
            logger.error(f"Error creating table '{table_name}': {e}")
            return False
    
    def insert_csv_data(self, csv_data: pd.DataFrame, table_name: str) -> bool:
        """Insert CSV data into the specified table"""
        try:
            # Create dynamic table model
            dynamic_table = CSVData.create_table_from_csv(self.db.bind, csv_data, table_name)
            
            # Convert DataFrame to list of dictionaries
            data_records = csv_data.to_dict('records')
            
            # Insert data in batches
            batch_size = 1000
            for i in range(0, len(data_records), batch_size):
                batch = data_records[i:i + batch_size]
                self.db.bulk_insert_mappings(dynamic_table, batch)
            
            self.db.commit()
            logger.info(f"Inserted {len(data_records)} records into table '{table_name}'")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error inserting data into table '{table_name}': {e}")
            return False
    
    def get_table_info(self, table_name: str) -> Optional[Dict[str, Any]]:
        """Get information about a table"""
        try:
            # Check if table exists
            result = self.db.execute(text(f"""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = '{table_name}'
                ORDER BY ordinal_position
            """))
            
            columns = []
            for row in result:
                columns.append({
                    'name': row[0],
                    'type': row[1],
                    'nullable': row[2] == 'YES'
                })
            
            # Get row count
            count_result = self.db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
            row_count = count_result.scalar()
            
            return {
                'table_name': table_name,
                'columns': columns,
                'row_count': row_count
            }
        except Exception as e:
            logger.error(f"Error getting table info for '{table_name}': {e}")
            return None
    
    def get_table_data(self, table_name: str, limit: int = 100) -> Optional[List[Dict[str, Any]]]:
        """Get data from a table"""
        try:
            result = self.db.execute(text(f"SELECT * FROM {table_name} LIMIT {limit}"))
            columns = result.keys()
            return [dict(zip(columns, row)) for row in result.fetchall()]
        except Exception as e:
            logger.error(f"Error getting data from table '{table_name}': {e}")
            return None


class ChurnPredictionRepository:
    """Repository for churn prediction operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_prediction(self, customer_id: str, prediction: float, probability: float, features: str) -> ChurnPrediction:
        """Create a new churn prediction"""
        prediction_record = ChurnPrediction(
            customer_id=customer_id,
            prediction=prediction,
            probability=probability,
            features=features
        )
        self.db.add(prediction_record)
        self.db.commit()
        self.db.refresh(prediction_record)
        return prediction_record
    
    def get_predictions_by_customer(self, customer_id: str) -> List[ChurnPrediction]:
        """Get predictions for a specific customer"""
        return self.db.query(ChurnPrediction).filter(
            ChurnPrediction.customer_id == customer_id
        ).order_by(ChurnPrediction.created_at.desc()).all()
    
    def get_all_predictions(self, limit: int = 100) -> List[ChurnPrediction]:
        """Get all predictions with limit"""
        return self.db.query(ChurnPrediction).order_by(
            ChurnPrediction.created_at.desc()
        ).limit(limit).all() 