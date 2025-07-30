import pandas as pd
from . import get_db,engine
from fastapi import HTTPException
from ..models.uploadHistory import UploadHistory
from datetime import datetime
from sqlalchemy import Table, Column, Integer, Float, String, DateTime, MetaData


def get_customers_aggregated( table_name: str)->pd.DataFrame:
    """Get specific customer by ID"""
    query = f"SELECT * FROM {table_name}"
    df = pd.read_sql(query, engine, params={"table_name": table_name})
    if df.empty:
        raise HTTPException(status_code=404, detail=f"customer {customer_id} not found")
    features = ['Customer ID','Total Purchase Amount', 'Quantity', 'Customer Age','Gender_Male']

    df_cluster = df[features].copy()
    df_cluster['Customer ID copy'] = df_cluster['Customer ID'].copy()
    df_cluster.rename(columns={'Gender_Male':'Gender'},inplace=True)
    df_agg = df_cluster.groupby('Customer ID copy').agg({
        'Total Purchase Amount': 'sum',
        'Quantity': 'sum',
        'Customer Age': 'first',
        'Gender': 'first',
        'Customer ID': 'first',
    })
    df_cluster = df_agg
    return df_cluster

def get_customer (customer_id: int, table_name: str)->pd.DataFrame:
    """Get specific customer by ID"""
    try:
        customer_id = int(customer_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail=f"Invalid customer_id: {customer_id}")
    
    query = f"SELECT * FROM {table_name} WHERE \"Customer ID\" = %(customer_id)s"
    df = pd.read_sql(query, engine, params={"customer_id": customer_id, "table_name": table_name})
    if df.empty:
        raise HTTPException(status_code=404, detail=f"customer {customer_id} not found")
    return df   
 
def get_all_customers_from_db(table_name:str)->pd.DataFrame:
    query = f"SELECT * FROM {table_name}"
    df = pd.read_sql(query,engine,params={"table_name": table_name})
    if df.empty:
        raise HTTPException(status_code=404,detail=f"table {table_name} not found")
    return df


def get_customers_in_batches_from_db(table_name: str, batch_size: int = 1000):
    query = f"SELECT * FROM {table_name}"
    for chunk in pd.read_sql(query, engine, chunksize=batch_size):
        if chunk.empty:
            break
        yield chunk

def create_user_prediction_table(user_id):

    predictions_table_name = f"user_predictions_{user_id}"
    metadata = MetaData()

    predictions_table = Table(
        predictions_table_name,
        metadata,
        Column("id", Integer, primary_key=True, autoincrement=True),
        Column("customer_id", Integer, nullable=False),
        Column("churn_probability", Float, nullable=False),
        Column("confidince", Float, nullable=True),
        Column("name", String(255), nullable=True),
        Column("email", String(255), nullable=True),
        Column("totalSpent", Float, nullable=True),
        Column("last_purchase_date", DateTime, nullable=True),
        extend_existing=True
    )

    if not engine.dialect.has_table(engine.connect(), predictions_table_name):
        predictions_table.create(engine)


def insert_csv_data_to_table(csv_file_path, table_name, engine, column_mapping=None):
    """ 
    Insert CSV data into the specified table (now used for per-user tables)
    """
    data = pd.read_csv(csv_file_path, low_memory=False)
    if column_mapping:
        mapping_dict = {
            column_mapping.customer_id: 'Customer ID',
            column_mapping.customer_name: 'Customer Name',
            column_mapping.purchase_date: 'Purchase Date',
            column_mapping.product_price: 'Product Price',
            column_mapping.quantity: 'Quantity',
            column_mapping.total_purchase_amount: 'Total Purchase Amount',
            column_mapping.returns: 'Returns',
            column_mapping.age: 'Age',
            column_mapping.gender: 'Gender',
            column_mapping.payment_method: 'Payment Method',
            column_mapping.product_category: 'Product Category',
            column_mapping.churn: 'Churn'
        }
        
        data = data.rename(columns=mapping_dict)
    
    required_columns = [
        'Customer ID', 'Customer Name', 'Purchase Date', 'Product Price', 'Quantity', 
        'Total Purchase Amount', 'Returns', 'Age', 'Gender', 'Payment Method', 
        'Product Category', 'Churn'
    ]    
    data['Purchase Date'] = pd.to_datetime(data['Purchase Date'])
    data['Year'] = data['Purchase Date'].dt.year
    data['Month'] = data['Purchase Date'].dt.month
    data['Day'] = data['Purchase Date'].dt.day
    

    data['Age'] = pd.to_numeric(data['Age'], errors='coerce').fillna(30)
    data['Product Price'] = pd.to_numeric(data['Product Price'], errors='coerce').fillna(0)
    data['Quantity'] = pd.to_numeric(data['Quantity'], errors='coerce').fillna(1)
    data['Total Purchase Amount'] = pd.to_numeric(data['Total Purchase Amount'], errors='coerce').fillna(0)
    data['Returns'] = pd.to_numeric(data['Returns'], errors='coerce').fillna(0)
    data['Churn'] = pd.to_numeric(data['Churn'], errors='coerce').fillna(0)
    
    categorical_columns = ['Gender', 'Payment Method', 'Product Category']
    data = pd.get_dummies(data, columns=categorical_columns, drop_first=True)

    for col in data.columns:
        if data[col].dtype == bool:
            data[col] = data[col].astype(float)

    data.to_sql(table_name, engine, if_exists='replace', index=False)
    print(f"Data inserted into table '{table_name}' successfully!")
    return len(data)
    
def save_upload_history(user_id: int, filename: str, table_name: str, status: str, file_size: int, records_count: int = None, error_message: str = None):
    """Save upload history to database"""
    try:
        db = next(get_db())
        upload_entry = UploadHistory(
            user_id=user_id,
            filename=filename,
            table_name=table_name,
            upload_time=datetime.now(),  
            status=status,
            file_size=file_size,
            records_count=records_count,
            error_message=error_message
        )
        db.add(upload_entry)
        db.commit()
        db.refresh(upload_entry)
        return upload_entry
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving upload history: {str(e)}")
    finally:
        db.close()

def get_user_upload_history(user_id: int, limit: int = 50):
    """Get upload history for a specific user"""
    try:
        db = next(get_db())
        history = db.query(UploadHistory).filter(
            UploadHistory.user_id == user_id
        ).order_by(
            UploadHistory.upload_time.desc()
        ).limit(limit).all()
        
        return [
            {
                "id": str(entry.id),
                "filename": entry.filename,
                "tableName": entry.table_name,
                "uploadTime": entry.upload_time.isoformat(),
                "status": entry.status,
                "fileSize": entry.file_size,
                "recordsCount": entry.records_count,
                "errorMessage": entry.error_message
            }
            for entry in history
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving upload history: {str(e)}")
    finally:
        db.close()
    