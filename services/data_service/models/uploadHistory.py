import pandas as pd
from ..database import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime

class UploadHistory(Base):
    __tablename__ = "upload_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    filename = Column(String, nullable=False)
    table_name = Column(String, nullable=False)
    upload_time = Column(DateTime, default=datetime.utcnow)
    status = Column(String, nullable=False)  
    file_size = Column(Integer, nullable=False)
    records_count = Column(Integer, nullable=True)
    error_message = Column(String, nullable=True) 
