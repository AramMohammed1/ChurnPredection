# Churn Prediction API - Refactored Structure

## 🏗️ New Architecture Overview

The application has been refactored into a well-organized, modular structure with clear separation of concerns.

## 📁 Directory Structure

```
churn_service/
├── routers/                 # API route handlers
│   ├── __init__.py
│   ├── auth.py             # Authentication endpoints
│   ├── data.py             # Data management endpoints
│   └── churn.py            # Churn prediction endpoints
├── database/               # Database layer
│   ├── __init__.py
│   └── repositories.py     # Data access layer
├── domain.py              # Business logic
├── models.py              # SQLAlchemy models
├── churn_service.py       # ML model service
├── auth_utils.py          # Authentication utilities
├── config.py              # Configuration management
├── main.py                # Original monolithic app
└── main_new.py            # New organized app
```

## 🔧 Key Improvements

### 1. **Modular Router Structure**
- **Auth Router** (`/api/v1/auth`): User registration, login, token management
- **Data Router** (`/api/v1/data`): CSV upload, customer data management
- **Churn Router** (`/api/v1/churn`): ML predictions and batch processing

### 2. **Configuration Management**
- Centralized settings in `config.py`
- Environment variable support
- Type-safe configuration with Pydantic

### 3. **Better Error Handling**
- Consistent error responses
- Proper HTTP status codes
- Detailed error messages

### 4. **Authentication Integration**
- All endpoints now require authentication
- JWT token validation
- User context in all operations

## 🚀 Getting Started

### 1. Install Dependencies
```bash
pip install -r requirements_new.txt
```

### 2. Set Up Environment
Copy `env_example.txt` to `.env` and configure your settings:
```bash
cp env_example.txt .env
# Edit .env with your configuration
```

### 3. Run the Application
```bash
python run_app.py
```

## 📡 API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh` - Refresh access token
- `GET /me` - Get current user info

### Data Management (`/api/v1/data`)
- `POST /upload_csv` - Upload CSV file
- `POST /validate_csv_columns` - Validate CSV structure
- `GET /customers` - Get all customers
- `GET /customers/{table_name}/{customer_id}` - Get specific customer
- `GET /customers/{table_name}/{customer_id}/data` - Get aggregated customer data

### Churn Prediction (`/api/v1/churn`)
- `GET /predict/{customer_id}` - Predict churn for single customer
- `POST /predict_batch` - Start batch prediction
- `GET /progress/{task_id}` - Get batch prediction progress
- `POST /cancel/{task_id}` - Cancel batch prediction
- `GET /churned_customers` - Get all churned customers

## 🔐 Authentication

All endpoints (except login/register) require authentication:
```bash
# Include in headers
Authorization: Bearer <your_access_token>
```

## 📊 Database

The application uses PostgreSQL with SQLAlchemy ORM:
- Automatic table creation on startup
- Support for multiple data tables
- Flexible column mapping for CSV imports

## 🤖 ML Model

- Transformer-based churn prediction model
- Automatic model loading on startup
- Support for batch and individual predictions
- Progress tracking for long-running operations

## 🛠️ Development

### Running in Development Mode
```bash
RELOAD=true python run_app.py
```

### API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Health Check
```bash
curl http://localhost:8000/health
```

## 🔄 Migration from Old Structure

The original `main.py` is preserved for reference. To migrate:

1. Update your frontend API calls to use the new endpoints
2. Update authentication to use the new auth endpoints
3. Test all functionality with the new structure

## 📝 Next Steps

1. **Add Logging**: Implement structured logging
2. **Add Monitoring**: Health checks and metrics
3. **Add Tests**: Unit and integration tests
4. **Add Documentation**: API documentation
5. **Add Validation**: Input validation and sanitization

## 🐛 Troubleshooting

### Common Issues

1. **Import Errors**: Make sure all dependencies are installed
2. **Database Connection**: Check your DATABASE_URL in .env
3. **Model Loading**: Ensure model files exist in the correct paths
4. **CORS Issues**: Verify allowed origins in configuration

### Logs
Check the console output for detailed error messages and startup information. 