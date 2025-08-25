import base64
import hashlib
import requests
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

# Configuration
BASE_URL = "http://192.168.1.3:5001"
EMAIL = "ajay@gmail.com"
CHALLENGE_PHRASE = "ajay-secure-phrase-123"

def signup():
    """Helper function to create a new user if needed"""
    response = requests.post(f"{BASE_URL}/signup", json={
        "email": EMAIL,
        "name": "Ajay",
        "role": "user",
        "challenge_phrase": CHALLENGE_PHRASE
    })
    if response.status_code == 201:
        print("Signup successful")
        return response.json()['public_key']
    elif "already registered" in response.json().get('error', '').lower():
        print("User already exists, proceeding to login...")
        return None
    else:
        print("Signup failed:", response.json())
        return None

def login():
    # Use development login endpoint
    response = requests.post(f"{BASE_URL}/login/dev", json={
        "email": EMAIL,
        "challenge_phrase": CHALLENGE_PHRASE
    })
    
    if response.status_code == 200:
        print("Login successful!")
        return response.json()['session_token']
    else:
        print("Login failed:", response.json())
        return None

# Run the login flow
if __name__ == "__main__":
    session_token = login()
    if session_token:
        print("Session token:", session_token)
        # Test the session
        response = requests.get(
            f"{BASE_URL}/profile",
            headers={"Authorization": session_token}
        )
        print("Profile response:", response.json())
    else:
        print("Login failed. Please check the error messages above.")