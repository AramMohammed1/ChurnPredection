from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from typing import Optional, Dict, Any
import pandas as pd

Base = declarative_base()


class CSVData(Base):
    """Dynamic table model for CSV data"""
    __tablename__ = "csv_data"
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    @classmethod
    def create_table_from_csv(cls, engine, csv_data: pd.DataFrame, table_name: str = "csv_data"):
        """Create a table dynamically based on CSV columns"""
        # Create column definitions based on CSV data types
        columns = []
        columns.append(Column('id', Integer, primary_key=True, index=True))
        columns.append(Column('created_at', DateTime(timezone=True), server_default=func.now()))
        columns.append(Column('updated_at', DateTime(timezone=True), onupdate=func.now()))
        
        for column_name, dtype in csv_data.dtypes.items():
            # Map pandas dtypes to SQLAlchemy types
            if dtype == 'object':
                col_type = Text
            elif dtype == 'int64':
                col_type = Integer
            elif dtype == 'float64':
                col_type = Float
            elif dtype == 'bool':
                col_type = Boolean
            else:
                col_type = Text  # Default to Text for unknown types
            
            columns.append(Column(column_name, col_type))
        
        # Create dynamic table
        dynamic_table = type(table_name, (Base,), {
            '__tablename__': table_name,
            '__table_args__': {'extend_existing': True}
        })
        
        # Add columns to the dynamic table
        for column in columns:
            setattr(dynamic_table, column.name, column)
        
        return dynamic_table


class ChurnPrediction(Base):
    """Model for storing churn predictions"""
    __tablename__ = "churn_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String(255), index=True)
    prediction = Column(Float)
    probability = Column(Float)
    features = Column(Text)  # JSON string of features
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class DataUpload(Base):
    """Model for tracking data uploads"""
    __tablename__ = "data_uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    table_name = Column(String(255), nullable=False)
    row_count = Column(Integer, nullable=False)
    column_count = Column(Integer, nullable=False)
    upload_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True) 