# Churn Prediction Project

A FastAPI-based application for customer churn prediction with improved database connection handling using context managers.

## Features

- **Context Manager Database Connections**: Automatic resource management for database connections
- **SQLAlchemy Integration**: ORM support with automatic session management
- **Raw PostgreSQL Support**: Direct database access with connection pooling
- **Dynamic Table Creation**: Create tables from CSV files
- **RESTful API**: FastAPI endpoints for data retrieval and analysis

## Database Connection Management

### SQLAlchemy Context Manager

```python
from database import get_db

# Automatic session management with commit/rollback
with get_db() as db:
    # Your database operations here
    result = db.query(SomeModel).all()
    # Session automatically committed on success, rolled back on error
```

### Raw PostgreSQL Context Manager

```python
from database import get_raw_db_connection
from psycopg2.extras import RealDictCursor

# Automatic connection management
with get_raw_db_connection() as connection:
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT * FROM table_name")
        result = cursor.fetchall()
    # Connection automatically closed
```

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up PostgreSQL database:
   - Create database: `churn_prediction_db`
   - Update connection string in `database.py` if needed

3. Run the application:
```bash
uvicorn main:app --reload
```

## API Endpoints

- `GET /`: Hello world endpoint
- `GET /data/{table_name}`: Retrieve all data from a table
- `GET /data/{table_name}/filter`: Filter data with conditions
- `GET /schema/{table_name}`: Get table schema
- `GET /count/{table_name}`: Get row count

## Benefits of Context Managers

1. **Automatic Resource Cleanup**: Connections are automatically closed
2. **Transaction Management**: Automatic commit/rollback handling
3. **Error Handling**: Graceful error recovery
4. **Cleaner Code**: No manual connection management needed
5. **Thread Safety**: Proper connection handling in multi-threaded environments

## Example Usage

See `example_usage.py` for comprehensive examples of using the context managers.