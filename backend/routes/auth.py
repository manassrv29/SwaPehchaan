from flask import Blueprint, request, jsonify
from models import db, User, Session, ActivityLog
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.fernet import Fernet
import base64, hashlib, secrets, os
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint('auth', __name__)

FERNET_KEY = base64.urlsafe_b64encode(hashlib.sha256(b'secret_demo_key').digest())
fernet = Fernet(FERNET_KEY)

def hash_phrase(phrase):
    return hashlib.sha256(phrase.encode()).hexdigest()

def encrypt_private_key(private_key_bytes):
    return fernet.encrypt(private_key_bytes)

def decrypt_private_key(encrypted_bytes):
    return fernet.decrypt(encrypted_bytes)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    print("\n=== SIGNUP REQUEST ===")
    print(f"Headers: {dict(request.headers)}")
    print(f"Content-Type: {request.content_type}")
    
    try:
        if not request.is_json:
            print("Error: Request must be JSON")
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        print(f"Request data: {data}")
        
        # Validate required fields
        required_fields = ['email', 'name', 'password', 'role', 'challenge_phrase']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            print(f"Error: Missing required fields: {', '.join(missing_fields)}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
            
        email = data['email']
        name = data['name']
        password = data['password']
        role = data['role']
        challenge_phrase = data['challenge_phrase']
        
        print(f"Processing signup for email: {email}")
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            print(f"User with email {email} already exists")
            return jsonify({'error': 'Email already registered'}), 409

        print("Generating key pair...")
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        private_bytes = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        public_key = private_key.public_key()
        public_bytes = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
        print("Encrypting private key...")
        private_key_encrypted = encrypt_private_key(private_bytes)
        challenge_phrase_hash = hash_phrase(challenge_phrase)
        
        print("Creating user object...")
        password_hash = generate_password_hash(password)
        user = User(
            email=email,
            name=name,
            role=role,
            password_hash=password_hash,
            public_key=public_bytes.decode(),
            private_key_encrypted=base64.b64encode(private_key_encrypted).decode(),
            challenge_phrase_hash=challenge_phrase_hash
        )
        
        print("Adding user to database...")
        db.session.add(user)
        db.session.commit()
        
        print(f"Successfully created user with email: {email}")
        return jsonify({
            'message': 'Signup successful', 
            'public_key': public_bytes.decode()
        }), 201
        
    except Exception as e:
        print(f"Error in signup: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({'error': 'An error occurred during signup', 'details': str(e)}), 500

@auth_bp.route('/login/challenge', methods=['GET'])
def get_challenge():
    email = request.args.get('email')
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    challenge = secrets.token_urlsafe(32)
    # In production, store challenge in a temp table or cache with expiry
    return jsonify({'challenge': challenge}), 200

@auth_bp.route('/dev-login', methods=['POST'])
def dev_login():
    print("\n=== DEV LOGIN REQUEST ===")
    print(f"Headers: {dict(request.headers)}")
    print(f"Content-Type: {request.content_type}")
    
    try:
        if not request.is_json:
            print("Error: Request must be JSON")
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        print(f"Request data: {data}")
        
        email = data.get('email')
        if not email:
            print("Error: Email is required")
            return jsonify({'error': 'Email is required'}), 400
            
        print(f"Looking up user with email: {email}")
        user = User.query.filter_by(email=email).first()
        
        if not user:
            print(f"User not found, creating new user with email: {email}")
            # Auto-create user if they don't exist (for development only)
            user = User(
                email=email,
                name=email.split('@')[0],
                role='user',
                public_key='dev_public_key_' + email,  # Make it unique per user
                private_key_encrypted='dev_private_key_encrypted_' + email,
                challenge_phrase_hash='dev_challenge_phrase_hash_' + email,
                created_at=datetime.utcnow()
            )
            db.session.add(user)
            db.session.commit()
            print(f"Created new user with ID: {user.id}")
        else:
            print(f"Found existing user with ID: {user.id}")
        
        # Create a session with required fields
        print("Creating new session...")
        session_token = secrets.token_urlsafe(64)
        expires_at = datetime.utcnow() + timedelta(hours=12)
        session = Session(
            user_id=user.id,
            session_token=session_token,
            expires_at=expires_at
        )
        
        # Update last login timestamp
        user.last_login = datetime.utcnow()
        
        db.session.add(session)
        db.session.commit()
        print(f"Created session with ID: {session.id}")
        
        # Log the login activity
        try:
            ip_address = request.remote_addr
            user_agent = request.headers.get('User-Agent')
            
            activity = ActivityLog(
                user_id=user.id,
                activity_type='login',
                details='Development login',
                ip_address=ip_address,
                user_agent=user_agent,
                status='success'
            )
            db.session.add(activity)
            db.session.commit()
            print(f"Logged login activity for user {user.id}")
        except Exception as e:
            print(f"Error logging activity: {str(e)}")
            # Don't rollback the session creation if activity logging fails
        
        response_data = {
            'message': 'Login successful',
            'session_token': session_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role
            }
        }
        
        print(f"Returning response: {response_data}")
        return jsonify(response_data), 200
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in dev_login: {str(e)}\n{error_details}")
        db.session.rollback()
        return jsonify({'error': 'An error occurred during login', 'details': str(e)}), 500

@auth_bp.route('/user/<email>/reference-status', methods=['GET'])
def get_reference_status(email):
    """Check if user has a reference photo"""
    try:
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if reference image exists
        has_reference = bool(user.reference_image)
        
        return jsonify({
            'hasReference': has_reference,
            'email': email
        }), 200
        
    except Exception as e:
        print(f"Error checking reference status: {str(e)}")
        return jsonify({'error': 'Failed to check reference status'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    print("\n=== LOGIN REQUEST ===")
    print(f"Headers: {dict(request.headers)}")
    print(f"Content-Type: {request.content_type}")
    
    try:
        if not request.is_json:
            print("Error: Request must be JSON")
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        print(f"Request data: {data}")
        
        # Validate required fields
        required_fields = ['email', 'password', 'role']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            print(f"Error: Missing required fields: {', '.join(missing_fields)}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
            
        email = data['email']
        password = data['password']
        role = data['role']
        
        print(f"Looking up user with email: {email}")
        user = User.query.filter_by(email=email).first()
        
        if not user:
            print(f"User not found with email: {email}")
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.password_hash or not check_password_hash(user.password_hash, password):
            print(f"Invalid password for user: {email}")
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if user.role != role:
            print(f"Role mismatch. Expected: {user.role}, Got: {role}")
            return jsonify({'error': 'Invalid role for this user'}), 401
        
        # Create a session with required fields
        print("Creating new session...")
        session_token = secrets.token_urlsafe(64)
        expires_at = datetime.utcnow() + timedelta(hours=12)
        session = Session(
            user_id=user.id,
            session_token=session_token,
            expires_at=expires_at
        )
        
        # Update last login timestamp
        user.last_login = datetime.utcnow()
        
        db.session.add(session)
        db.session.commit()
        print(f"Created session with ID: {session.id}")
        
        # Log the login activity
        try:
            ip_address = request.remote_addr
            user_agent = request.headers.get('User-Agent')
            
            activity = ActivityLog(
                user_id=user.id,
                activity_type='login',
                details='Password-based login',
                ip_address=ip_address,
                user_agent=user_agent,
                status='success'
            )
            db.session.add(activity)
            db.session.commit()
            print(f"Logged login activity for user {user.id}")
        except Exception as e:
            print(f"Error logging activity: {str(e)}")
            # Don't rollback the session creation if activity logging fails
        
        response_data = {
            'message': 'Login successful',
            'session_token': session_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role
            }
        }
        
        print(f"Returning response: {response_data}")
        return jsonify(response_data), 200
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in login: {str(e)}\n{error_details}")
        db.session.rollback()
        return jsonify({'error': 'An error occurred during login', 'details': str(e)}), 500

@auth_bp.route('/login/challenge', methods=['POST'])
def login_challenge():
    data = request.get_json()
    email = data['email']
    challenge = data['challenge']
    signed_token_b64 = data['signed_token']
    challenge_phrase = data['challenge_phrase']

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if user.challenge_phrase_hash != hash_phrase(challenge_phrase):
        return jsonify({'error': 'Invalid challenge phrase'}), 401
    signature = base64.b64decode(signed_token_b64)
    public_key = serialization.load_pem_public_key(user.public_key.encode())
    try:
        public_key.verify(
            signature,
            challenge.encode(),
            padding.PKCS1v15(),
            hashes.SHA256()
        )
    except Exception:
        return jsonify({'error': 'Invalid signature'}), 401
    session_token = secrets.token_urlsafe(64)
    expires_at = datetime.utcnow() + timedelta(hours=12)
    session = Session(user_id=user.id, session_token=session_token, expires_at=expires_at)
    
    # Update last login timestamp
    user.last_login = datetime.utcnow()
    
    db.session.add(session)
    db.session.commit()
    
    # Log the login activity
    try:
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent')
        
        activity = ActivityLog(
            user_id=user.id,
            activity_type='login',
            details='Standard login with challenge phrase',
            ip_address=ip_address,
            user_agent=user_agent,
            status='success'
        )
        db.session.add(activity)
        db.session.commit()
    except Exception as e:
        print(f"Error logging activity: {str(e)}")
        # Don't rollback the session creation if activity logging fails
    return jsonify({'message': 'Login successful', 'session_token': session_token, 'role': user.role}), 200

def require_session(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Missing session token'}), 401
        session = Session.query.filter_by(session_token=token).first()
        if not session or session.expires_at < datetime.utcnow():
            return jsonify({'error': 'Invalid or expired session'}), 401
        request.user = session.user
        return f(*args, **kwargs)
    return decorated

@auth_bp.route('/profile', methods=['GET'])
@require_session
def view_profile():
    user = request.user
    return jsonify({'email': user.email, 'id': user.id, 'role': user.role, 'name': user.name}), 200
