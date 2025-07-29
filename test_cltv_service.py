import requests
import json
import time

# Test configuration
CLTV_SERVICE_URL = "http://localhost:8003"
DATA_SERVICE_URL = "http://localhost:8011"
AUTH_SERVICE_URL = "http://localhost:8012"

def test_cltv_service():
    """Test the CLTV service endpoints"""
    
    print("🧪 Testing CLTV Service...")
    
    # Test 1: Health check
    print("\n1. Testing health check...")
    try:
        response = requests.get(f"{CLTV_SERVICE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")
    
    # Test 2: Root endpoint
    print("\n2. Testing root endpoint...")
    try:
        response = requests.get(f"{CLTV_SERVICE_URL}/")
        if response.status_code == 200:
            print("✅ Root endpoint passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
    
    # Test 3: CLTV endpoints (without auth - should fail)
    print("\n3. Testing CLTV endpoints without authentication...")
    try:
        response = requests.get(f"{CLTV_SERVICE_URL}/cltv/calculate")
        if response.status_code == 401:
            print("✅ Authentication required (expected)")
        else:
            print(f"❌ Unexpected response: {response.status_code}")
    except Exception as e:
        print(f"❌ CLTV endpoint error: {e}")
    
    # Test 4: CLTV segments endpoint (without auth - should fail)
    print("\n4. Testing CLTV segments endpoint without authentication...")
    try:
        response = requests.get(f"{CLTV_SERVICE_URL}/cltv/segments")
        if response.status_code == 401:
            print("✅ Authentication required (expected)")
        else:
            print(f"❌ Unexpected response: {response.status_code}")
    except Exception as e:
        print(f"❌ CLTV segments endpoint error: {e}")
    
    print("\n🎯 CLTV Service test completed!")
    print("\n📋 To test with real data:")
    print("1. Start the auth service: python start_auth_service.py")
    print("2. Start the data service: python start_data_service.py")
    print("3. Start the CLTV service: python start_cltv_service.py")
    print("4. Upload data via the frontend")
    print("5. Use the CLTV analysis component in the frontend")

if __name__ == "__main__":
    test_cltv_service() 