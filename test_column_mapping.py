import requests
import json

# Test the column mapping endpoints
BASE_URL = "http://localhost:8000"

def test_validate_csv_columns():
    """Test the CSV validation endpoint"""
    print("Testing CSV validation endpoint...")
    
    # Create a simple CSV file for testing
    csv_content = "Customer ID,Customer Name,Purchase Date,Product Price,Quantity,Total Amount\n1,John Doe,2023-01-01,29.99,2,59.98"
    
    files = {'file': ('test.csv', csv_content, 'text/csv')}
    
    try:
        response = requests.post(f"{BASE_URL}/validate_csv_columns", files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_upload_csv_with_mapping():
    """Test the upload CSV endpoint with column mapping"""
    print("\nTesting CSV upload with column mapping...")
    
    # Create a simple CSV file for testing
    csv_content = "ID,Name,Date,Price,Qty,Total\n1,John Doe,2023-01-01,29.99,2,59.98"
    
    # Create column mapping
    column_mapping = {
        "customer_id": "ID",
        "customer_name": "Name", 
        "purchase_date": "Date",
        "product_price": "Price",
        "quantity": "Qty",
        "total_purchase_amount": "Total"
    }
    
    files = {
        'file': ('test_mapping.csv', csv_content, 'text/csv'),
        'table_name': (None, 'test_table'),
        'column_mapping_json': (None, json.dumps(column_mapping))
    }
    
    try:
        response = requests.post(f"{BASE_URL}/upload_csv", files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("Testing Column Mapping Endpoints")
    print("=" * 40)
    
    # Test validation endpoint
    validation_ok = test_validate_csv_columns()
    
    # Test upload endpoint
    upload_ok = test_upload_csv_with_mapping()
    
    print("\n" + "=" * 40)
    print("Results:")
    print(f"Validation endpoint: {'✅ PASS' if validation_ok else '❌ FAIL'}")
    print(f"Upload endpoint: {'✅ PASS' if upload_ok else '❌ FAIL'}")
    
    if not validation_ok or not upload_ok:
        print("\nMake sure the backend server is running on localhost:8000")
        print("Run: cd churn_service && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000") 