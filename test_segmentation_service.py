#!/usr/bin/env python3
"""
Test script for the Segmentation Service
"""
import requests
import json
import time

SEGMENTATION_SERVICE_URL = "http://localhost:8014"

def test_segmentation_service():
    """Test the segmentation service endpoints"""
    
    print("🧪 Testing Segmentation Service...")
    print(f"📍 URL: {SEGMENTATION_SERVICE_URL}")
    
    # Test 1: Health check
    print("\n1. Testing health check...")
    try:
        response = requests.get(f"{SEGMENTATION_SERVICE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")
    
    # Test 2: Root endpoint
    print("\n2. Testing root endpoint...")
    try:
        response = requests.get(f"{SEGMENTATION_SERVICE_URL}/")
        if response.status_code == 200:
            print("✅ Root endpoint passed")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Root endpoint error: {str(e)}")
    
    # Test 3: Model loading (this will be tested when the service starts)
    print("\n3. Testing model loading...")
    print("ℹ️  Model loading is tested during service startup")
    
    print("\n🎉 Segmentation service tests completed!")
    print("\n📋 Next steps:")
    print("1. Start the segmentation service: python start_segmentation_service.py")
    print("2. Test with real data through the frontend")
    print("3. Check the API documentation at: http://localhost:8014/docs")

if __name__ == "__main__":
    test_segmentation_service() 