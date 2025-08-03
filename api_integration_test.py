from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
import random
from datetime import datetime, timedelta
import json

app = FastAPI(
    title="API Integration Test Server",
    description="Test server to simulate external API for churn prediction data import",
    version="1.0.0"
)

security = HTTPBearer()

def generate_sample_customers(count: int = 50) -> List[dict]:
    """Generate sample customer data in the expected format (raw categorical data)"""
    
    names = [
        "John Smith", "Emma Johnson", "Michael Brown", "Sarah Davis", "David Wilson",
        "Lisa Anderson", "James Taylor", "Jennifer Martinez", "Robert Garcia", "Amanda Rodriguez",
        "William Lopez", "Jessica Gonzalez", "Christopher Perez", "Ashley Torres", "Daniel Ramirez",
        "Nicole Campbell", "Matthew Mitchell", "Stephanie Roberts", "Joshua Carter", "Rebecca Phillips",
        "Andrew Evans", "Laura Turner", "Kevin Parker", "Michelle Edwards", "Brian Collins",
        "Heather Stewart", "Steven Morris", "Kimberly Rogers", "Timothy Reed", "Christine Cook",
        "Jeffrey Morgan", "Angela Bell", "Ryan Murphy", "Melissa Bailey", "Jacob Cooper",
        "Tiffany Richardson", "Gary Cox", "Rachel Ward", "Nicholas Torres", "Amber Peterson",
        "Eric Gray", "Danielle James", "Jonathan Bennett", "Brittany Wood", "Brandon Barnes",
        "Samantha Ross", "Adam Henderson", "Megan Coleman", "Nathan Jenkins", "Lauren Perry"
    ]
    
    payment_methods = ["Credit Card", "PayPal", "Cash"]
    product_categories = ["Electronics", "Clothing", "Books","Home"]
    genders = ["Male", "Female"]
    
    customers = []
    
    for i in range(count):
        days_ago = random.randint(1, 365)
        purchase_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        
        age = random.randint(18, 75)
        product_price = round(random.uniform(10.0, 500.0), 2)
        quantity = random.randint(1, 5)
        total_amount = round(product_price * quantity, 2)
        returns = round(random.uniform(0, total_amount * 0.1), 2)
        
        churn_probability = 0.0
        if age > 60:
            churn_probability += 0.3
        if returns > total_amount * 0.05:
            churn_probability += 0.4
        if total_amount < 50:
            churn_probability += 0.2
            
        churn = 1 if random.random() < churn_probability else 0
        
        customer = {
            "Customer ID": i + 1,
            "Customer Name": names[i % len(names)],
            "Purchase Date": purchase_date,
            "Product Price": product_price,
            "Quantity": quantity,
            "Total Purchase Amount": total_amount,
            "Returns": returns,
            "Age": age,
            "Gender": random.choice(genders), 
            "Payment Method": random.choice(payment_methods),
            "Product Category": random.choice(product_categories), 
            "Churn": churn
        }
        
        customers.append(customer)
    
    return customers

def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify the API key (for testing, accept any valid Bearer token)"""
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    if len(credentials.credentials) < 5:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return credentials.credentials

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "API Integration Test Server",
        "version": "1.0.0",
        "description": "Test server for churn prediction data import",
        "endpoints": {
            "customers": "/customers",
            "customers_with_limit": "/customers?limit={number}",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/customers")
async def get_customers(
    limit: Optional[int] = 50,
    api_key: str = Depends(verify_api_key)
):
    """
    Get customer data in the format expected by the churn prediction system
    
    Parameters:
    - limit: Number of customers to return (default: 50, max: 1000)
    - api_key: Bearer token for authentication
    
    Returns:
    - JSON array of customer objects with required fields
    - Categorical data is returned in raw format (e.g., "Male", "Credit Card")
    - The main application will handle one-hot encoding during processing
    """
    if limit is None:
        limit = 50
    elif limit > 1000:
        limit = 1000
    elif limit < 1:
        limit = 1
    
    customers = generate_sample_customers(limit)
    
    return customers

@app.get("/customers/with_metadata")
async def get_customers_with_metadata(
    limit: Optional[int] = 50,
    api_key: str = Depends(verify_api_key)
):
    """
    Get customer data with metadata wrapper (alternative format)
    
    Returns:
    - JSON object with 'data' field containing customer array
    """
    if limit is None:
        limit = 50
    elif limit > 1000:
        limit = 1000
    elif limit < 1:
        limit = 1
    
    customers = generate_sample_customers(limit)
    
    return {
        "data": customers,
        "total": len(customers),
        "timestamp": datetime.now().isoformat(),
        "source": "test_api"
    }

@app.get("/customers/small")
async def get_small_dataset(api_key: str = Depends(verify_api_key)):
    """Get a small dataset for quick testing"""
    return generate_sample_customers(10)

@app.get("/customers/large")
async def get_large_dataset(api_key: str = Depends(verify_api_key)):
    """Get a large dataset for performance testing"""
    return generate_sample_customers(500)

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting API Integration Test Server...")
    print("📊 This server simulates an external API for testing data import")
    print("🔑 Use any Bearer token for authentication (e.g., 'test-token-123')")
    print("📋 Available endpoints:")
    print("   - GET /customers (default 50 records)")
    print("   - GET /customers?limit=100 (custom number)")
    print("   - GET /customers/small (10 records)")
    print("   - GET /customers/large (500 records)")
    print("   - GET /customers/with_metadata (alternative format)")
    print("\n🌐 Server will be available at: http://localhost:8001")
    print("📝 Use this URL in your main app: http://localhost:8002/customers")
    print("🔑 API Key: test-token-123 (or any valid Bearer token)")
    
    uvicorn.run(app, host="0.0.0.0", port=8001) 