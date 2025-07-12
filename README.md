# Churn Prediction System

This project consists of a FastAPI backend service for churn prediction and a React frontend to display the results.

## Project Structure

```
├── churn_service/          # FastAPI backend service
│   ├── main.py            # FastAPI application
│   ├── domain.py          # Business logic for churn prediction
│   ├── churn_service.py   # ML model and prediction logic
│   ├── models.py          # Database models
│   ├── database/          # Database configuration
│   ├── scaler.pkl         # Trained scaler
│   ├── best_model.pth     # Trained model
│   └── ecommerce_customer_data_large.csv  # Sample data
├── Frontend/              # React frontend
│   └── src/
│       ├── components/
│       │   └── ChurnPrediction.tsx  # Main churn prediction component
│       └── services/
│           └── churnService.ts       # API service
└── test_api.py            # API testing script
```

## Setup Instructions

### 1. Backend Setup (Churn Service)

1. **Navigate to the churn service directory:**
   ```bash
   cd churn_service
   ```

2. **Install Python dependencies:**
   ```bash
   pip install fastapi uvicorn pandas numpy torch scikit-learn sqlalchemy
   ```

3. **Start the FastAPI server:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   The server will start on `http://localhost:8000`

4. **Test the API endpoints:**
   ```bash
   python test_api.py
   ```

### 2. Frontend Setup

1. **Navigate to the Frontend directory:**
   ```bash
   cd Frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the React development server:**
   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:5173` (or `http://localhost:3000`)

## API Endpoints

The backend provides the following endpoints:

- `GET /customers/all/{table_name}/` - Get all customers
- `GET /customers/{table_name}/{customer_id}` - Get specific customer
- `GET /Churns/?table_name={table_name}` - Get churn predictions for all customers
- `GET /customers_predicts/{customer_id}` - Get churn prediction for specific customer

## Features

### Frontend Features:
- **Real-time Data**: Fetches churn predictions from the backend API
- **High-Risk Customer Display**: Shows customers with highest churn probability
- **Summary Statistics**: Displays high-risk count, at-risk revenue, and retention rate
- **Loading States**: Shows loading spinner while fetching data
- **Error Handling**: Displays error messages if API calls fail
- **Responsive Design**: Works on desktop and mobile devices

### Backend Features:
- **ML Model Integration**: Uses trained PyTorch model for predictions
- **Database Integration**: Stores customer data in SQLite database
- **CORS Support**: Allows frontend to make API calls
- **RESTful API**: Clean API design with proper error handling

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure the backend is running and CORS is properly configured
2. **Model Loading Errors**: Ensure `best_model.pth` and `scaler.pkl` files exist
3. **Database Errors**: Check if the database file exists and has proper permissions
4. **Port Conflicts**: Make sure ports 8000 (backend) and 5173/3000 (frontend) are available

### Testing:

Run the test script to verify API functionality:
```bash
python test_api.py
```

## Data Flow

1. Frontend loads and calls `/Churns/` and `/customers/all/ecommerce/` endpoints
2. Backend processes customer data through the ML model
3. Frontend receives prediction data and displays high-risk customers
4. Summary statistics are calculated and displayed

## Model Information

- **Model Type**: Transformer-based neural network
- **Input**: Customer behavior sequences (10 time steps, 14 features each)
- **Output**: Churn probability (0-1)
- **Features**: Product price, quantity, total amount, returns, age, date features, payment method, product category