import requests
import json
import uuid

BASE_URL = "http://localhost:5001"

# Generate a unique email for testing
TEST_EMAIL = f"test_{uuid.uuid4().hex[:8]}@example.com"

def test_signup():
    print("Testing signup endpoint...")
    data = {
        "email": TEST_EMAIL,
        "name": "Test User",
        "password": "password123",
        "role": "user",
        "challenge_phrase": "test challenge phrase"
    }
    print(f"Using test email: {TEST_EMAIL}")
    
    try:
        response = requests.post(f"{BASE_URL}/signup", json=data)
        print(f"Status code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_login():
    print("\nTesting login endpoint...")
    data = {
        "email": TEST_EMAIL,
        "password": "password123",
        "role": "user"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login", json=data)
        print(f"Status code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    # First try to sign up
    signup_success = test_signup()
    
    # Then try to login
    login_success = test_login()
    
    if signup_success and login_success:
        print("\nAll tests passed!")
    else:
        print("\nSome tests failed.")
