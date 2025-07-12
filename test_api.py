import requests
import json

BASE_URL = "http://localhost:8000"

def test_endpoints():
    """Test the churn service API endpoints"""
    
    print("Testing Churn Service API endpoints...")
    
    # Test 1: Get all customers
    try:
        print("\n1. Testing /customers/all/ecommerce/")
        response = requests.get(f"{BASE_URL}/customers/all/ecommerce/")
        if response.status_code == 200:
            customers = response.json()
            print(f"✅ Success! Found {len(customers)} customers")
            if customers:
                print(f"   Sample customer: {customers[0]}")
        else:
            print(f"❌ Failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Get churned customers
    try:
        print("\n2. Testing /Churns/")
        response = requests.get(f"{BASE_URL}/Churns/?table_name=ecommerce")
        if response.status_code == 200:
            churn_data = response.json()
            print(f"✅ Success! Found churn data for {len(churn_data)} customers")
            if churn_data:
                # Show first customer's data
                first_customer_id = list(churn_data.keys())[0]
                first_customer_data = churn_data[first_customer_id]
                print(f"   Sample customer {first_customer_id}: {first_customer_data}")
        else:
            print(f"❌ Failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Get specific customer
    try:
        print("\n3. Testing /customers/ecommerce/1")
        response = requests.get(f"{BASE_URL}/customers/ecommerce/1")
        if response.status_code == 200:
            customer = response.json()
            print(f"✅ Success! Found customer data")
            print(f"   Customer data: {customer}")
        else:
            print(f"❌ Failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Predict churn for specific customer
    try:
        print("\n4. Testing /customers_predicts/1")
        response = requests.get(f"{BASE_URL}/customers_predicts/1")
        if response.status_code == 200:
            prediction = response.json()
            print(f"✅ Success! Got churn prediction")
            print(f"   Prediction: {prediction}")
        else:
            print(f"❌ Failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_endpoints() 