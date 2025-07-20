#!/usr/bin/env python3
"""
Test script for API Integration
This script tests the API integration functionality by:
1. Starting the test API server
2. Making requests to test the data format
3. Demonstrating how to use the main application's API import
"""

import requests
import json
import time
import subprocess
import sys
from typing import Dict, Any

# Configuration
TEST_API_URL = "http://localhost:8001"
MAIN_APP_URL = "http://localhost:8000"
API_KEY = "test-token-123"

def test_api_server():
    """Test the API integration test server"""
    print("🧪 Testing API Integration Test Server...")
    
    # Test health endpoint
    try:
        response = requests.get(f"{TEST_API_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
        else:
            print("❌ Health check failed")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to test API server. Make sure it's running on port 8001")
        return False
    
    # Test customers endpoint with authentication
    headers = {"Authorization": f"Bearer {API_KEY}"}
    
    try:
        response = requests.get(f"{TEST_API_URL}/customers?limit=5", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Successfully retrieved {len(data)} customers from test API")
            print(f"📊 Sample customer data:")
            if data:
                print(json.dumps(data[0], indent=2))
            return True
        else:
            print(f"❌ Failed to get customers: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing customers endpoint: {e}")
        return False

def test_main_app_import():
    """Test the main application's API import functionality"""
    print("\n🧪 Testing Main Application API Import...")
    
    # This would require authentication to the main app
    # For demonstration purposes, we'll show the expected request format
    
    print("📝 To test the main app import, use these parameters:")
    print(f"   API Endpoint: {TEST_API_URL}/customers")
    print(f"   API Key: {API_KEY}")
    print("\n📋 Expected request format:")
    
    example_request = {
        "api_endpoint": f"{TEST_API_URL}/customers",
        "api_key": API_KEY
    }
    print(json.dumps(example_request, indent=2))
    
    print("\n🔗 You can test this in the frontend by:")
    print("1. Going to the Data tab")
    print("2. Clicking on 'API Connection'")
    print("3. Entering the endpoint and API key")
    print("4. Clicking 'Import Data'")

def start_test_server():
    """Start the test API server"""
    print("🚀 Starting API Integration Test Server...")
    try:
        # Start the test server in a subprocess
        process = subprocess.Popen([
            sys.executable, "api_integration_test.py"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait a moment for the server to start
        time.sleep(3)
        
        # Check if the server is running
        try:
            response = requests.get(f"{TEST_API_URL}/health", timeout=5)
            if response.status_code == 200:
                print("✅ Test server started successfully")
                return process
            else:
                print("❌ Test server failed to start properly")
                process.terminate()
                return None
        except requests.exceptions.ConnectionError:
            print("❌ Test server failed to start")
            process.terminate()
            return None
            
    except Exception as e:
        print(f"❌ Error starting test server: {e}")
        return None

def main():
    """Main test function"""
    print("🔧 API Integration Test Suite")
    print("=" * 50)
    
    # Check if test server is already running
    try:
        response = requests.get(f"{TEST_API_URL}/health", timeout=2)
        if response.status_code == 200:
            print("✅ Test server is already running")
            server_process = None
        else:
            server_process = start_test_server()
    except requests.exceptions.ConnectionError:
        server_process = start_test_server()
    
    if server_process is None and not test_api_server():
        print("❌ Cannot proceed without test server")
        return
    
    # Test the API server
    if not test_api_server():
        print("❌ API server tests failed")
        if server_process:
            server_process.terminate()
        return
    
    # Test main app integration
    test_main_app_import()
    
    print("\n✅ All tests completed!")
    print("\n📋 Next steps:")
    print("1. Make sure your main application is running on port 8000")
    print("2. Open the frontend and go to Data > API Connection")
    print("3. Use these settings:")
    print(f"   - API Endpoint: {TEST_API_URL}/customers")
    print(f"   - API Key: {API_KEY}")
    print("4. Click 'Import Data' to test the integration")
    
    if server_process:
        print("\n🛑 Press Ctrl+C to stop the test server")
        try:
            server_process.wait()
        except KeyboardInterrupt:
            print("\n🛑 Stopping test server...")
            server_process.terminate()

if __name__ == "__main__":
    main() 