
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import text
from .database import get_db,engine

# Method 1: Using raw SQL
def get_customer_data():
    db = next(get_db())
    try:
        # Get all rows
        result = db.execute(text("SELECT * FROM customer_data where \"Customer ID\" = 44605 "))
        rows = result.fetchall()
        return rows
    finally:
        db.close()

# Method 2: Using pandas (since your data was loaded via pandas)
def get_customer_data_pandas():
    
    query = "SELECT * FROM customer_data where \"Customer ID\" = 44605 "
    df = pd.read_sql(query, engine)
    return df


def insert_csv_data_to_table(csv_file_path, table_name, engine):
    """
    Insert CSV data into the created table
    """
    # Read CSV file
    df = pd.read_csv(csv_file_path)
    
    # Insert data into table
    df.to_sql(table_name, engine, if_exists='replace', index=False)
    
    print(f"Data inserted into table '{table_name}' successfully!")