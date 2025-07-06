import pandas as pd
from .database import Base
from sqlalchemy import TIMESTAMP, text,create_engine, MetaData, Table, Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer,primary_key=True,nullable=False)
    title = Column(String,nullable=False)
    content = Column(String,nullable=False)
    published = Column(Boolean, server_default='TRUE')
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('now()'))





def create_table_from_csv(csv_file_path, table_name, engine):
    """
    Dynamically create a database table from CSV file
    """
    # Read CSV file
    df = pd.read_csv(csv_file_path)
    
    # Create metadata object
    metadata = MetaData()
    
    # Define column mappings for different data types
    column_mappings = {
        'object': String,
        'int64': Integer,
        'float64': Float,
        'datetime64[ns]': DateTime,
        'bool': Boolean
    }
    
    # Create table columns dynamically
    columns = []
    for column_name, dtype in df.dtypes.items():
        # Get the SQLAlchemy column type
        sql_type = column_mappings.get(str(dtype), String)
        
        # Handle special cases
        if column_name.lower() == 'id':
            # Primary key column
            col = Column(column_name, sql_type, primary_key=True, nullable=False)
        elif 'date' in column_name.lower():
            # Date/time columns
            col = Column(column_name, DateTime, nullable=True)
        elif 'amount' in column_name.lower() or 'price' in column_name.lower():
            # Numeric columns for amounts/prices
            col = Column(column_name, Float, nullable=True)
        elif 'age' in column_name.lower():
            # Age columns
            col = Column(column_name, Integer, nullable=True)
        elif 'churn' in column_name.lower():
            # Boolean columns
            col = Column(column_name, Boolean, nullable=True)
        else:
            # Default string columns
            col = Column(column_name, sql_type, nullable=True)
        
        columns.append(col)
    
    # Create table
    table = Table(table_name, metadata, *columns)
    
    # Create table in database
    metadata.create_all(engine)
    
    return table

# Example usage:
# insert_csv_data_to_table('ecommerce_customer_data_large.csv', 'customer_data', engine)
