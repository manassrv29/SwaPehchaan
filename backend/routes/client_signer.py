# client_signer.py
import requests
import base64
import hashlib
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.fernet import Fernet

# --- CONFIGURATION ---
BASE_URL = "http://127.0.0.1:5000" # Your Flask app's URL
USER_EMAIL = "manassrv29@gmail.com"
CHALLENGE_PHRASE = "my secret phrase"

# !! IMPORTANT: This must be the EXACT same key as in your Flask app !!
FERNET_KEY = base64.urlsafe_b64encode(hashlib.sha256(b'secret_demo_key').digest())
fernet = Fernet(FERNET_KEY)

# --- HELPER FUNCTIONS ---
def get_user_data(email):
    # This is a helper to get user data directly for the signing process.
    # In a real app, the client would already have its private key.
    # Here, we're mimicking a flawed flow where we must fetch it.
    print(f"[*] This helper assumes you have a way to get user data from your DB for testing.")
    print(f"[*] In a real secure app, the client would NEVER give away its private key.")
    # You would need an admin endpoint or direct DB access to get this for the test.
    # For now, let's assume you manually get `private_key_encrypted` after signup.
    return None # We will get this manually after signup.

def sign_challenge(private_key_pem_bytes, challenge_string):
    """Signs the challenge string with the user's private key."""
    private_key = serialization.load_pem_private_key(private_key_pem_bytes, password=None)
    signature = private_key.sign(
        challenge_string.encode('utf-8'),
        padding.PKCS1v15(),
        hashes.SHA256()
    )
    return base64.b64encode(signature).decode('utf-8')

# --- MAIN SCRIPT ---
if __name__ == "__main__":
    print("--- Testing Authentication Flow ---")

    # 1. Get the challenge from the server
    print(f"\n[1] Getting challenge for user: {USER_EMAIL}")
    try:
        challenge_res = requests.get(f"{BASE_URL}/login/challenge", params={'email': USER_EMAIL})
        challenge_res.raise_for_status()
        challenge_data = challenge_res.json()
        challenge = challenge_data.get('challenge')
        print(f"    > Challenge received: {challenge}")
    except requests.exceptions.RequestException as e:
        print(f"    ! Error getting challenge: {e}")
        print(f"    ! Response: {e.response.text}")
        exit()

    # 2. Get the encrypted private key (you must get this from your DB after signup)
    print("\n[2] Manually retrieve the 'private_key_encrypted' for the user from your database.")
    encrypted_private_key_b64 = input("    > Paste the user's 'private_key_encrypted' here: ")

    # 3. Decrypt the private key
    try:
        encrypted_private_key_bytes = base64.b64decode(encrypted_private_key_b64)
        private_key_bytes = fernet.decrypt(encrypted_private_key_bytes)
        print("    > Private key decrypted successfully.")
    except Exception as e:
        print(f"    ! Failed to decrypt private key: {e}")
        exit()

    # 4. Sign the challenge
    print("\n[3] Signing the challenge with the decrypted private key...")
    signed_token = sign_challenge(private_key_bytes, challenge)
    print("\n" + "="*50)
    print("✅ Signed Token Generated! Copy this into Postman.")
    print(f"\n   signed_token: {signed_token}\n")
    print("="*50)