#!/usr/bin/env python3

import requests
import json

# Test certificate submission endpoint
API_BASE_URL = "http://localhost:5001"

def test_certificate_submission():
    # First, create a test user
    signup_data = {
        "email": "test@example.com",
        "name": "Test User",
        "password": "password123",
        "role": "user",
        "challenge_phrase": "test phrase"
    }
    
    print("=== Creating Test User ===")
    signup_response = requests.post(f"{API_BASE_URL}/signup", json=signup_data)
    print(f"Signup Status: {signup_response.status_code}")
    print(f"Signup Response: {signup_response.text}")
    
    # Then, login to get a session token
    login_data = {
        "email": "test@example.com",
        "password": "password123",
        "role": "user"
    }
    
    print("=== Testing Login ===")
    login_response = requests.post(f"{API_BASE_URL}/login", json=login_data)
    print(f"Login Status: {login_response.status_code}")
    print(f"Login Response: {login_response.text}")
    
    if login_response.status_code != 200:
        print("Login failed, cannot test certificate submission")
        return
    
    # Get session token
    login_result = login_response.json()
    session_token = login_result.get('session_token')
    
    if not session_token:
        print("No session token received")
        return
    
    print(f"Session token: {session_token}")
    
    # Test certificate submission
    print("\n=== Testing Certificate Submission ===")
    cert_data = {
        "email": "test@example.com",
        "certificate_data": "Test certificate submission",
        "similarity_score": 0.85,
        "verification_status": "verified"
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": session_token
    }
    
    cert_response = requests.post(f"{API_BASE_URL}/submit", json=cert_data, headers=headers)
    print(f"Certificate Status: {cert_response.status_code}")
    print(f"Certificate Response: {cert_response.text}")
    
    # Test getting activities
    print("\n=== Testing Activities Endpoint ===")
    activities_response = requests.get(f"{API_BASE_URL}/activities", headers=headers)
    print(f"Activities Status: {activities_response.status_code}")
    print(f"Activities Response: {activities_response.text}")

if __name__ == "__main__":
    test_certificate_submission()
