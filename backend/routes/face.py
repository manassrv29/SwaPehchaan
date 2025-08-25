from flask import Blueprint, request, jsonify
import os
import cv2
import numpy as np
from models import db, User, ManualReview, ActivityLog
import tensorflow as tf
from PIL import Image
import dlib
from cryptography.fernet import Fernet
import base64, hashlib

# Initialize Fernet for encryption
fernet_key = Fernet.generate_key()
fernet = Fernet(fernet_key)

tflite = tf.lite

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Use relative path to the model file in the same directory
TFLITE_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'output_model.tflite')
IMG_SIZE = (112, 112)
SIMILARITY_THRESHOLD = 0.8

interpreter = tflite.Interpreter(model_path=TFLITE_MODEL_PATH)
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# Path to the shape predictor file in the BlinkDetection directory (in the project root)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PREDICTOR_PATH = os.path.join(project_root, 'BlinkDetection', 'shape_predictor_68_face_landmarks.dat')
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor(PREDICTOR_PATH)
EAR_THRESHOLD = 0.21
CONSEC_FRAMES = 2

FERNET_KEY = base64.urlsafe_b64encode(hashlib.sha256(b'super_secret_image_key').digest())
fernet = Fernet(FERNET_KEY)

def preprocess_face(img):
    img = cv2.resize(img, IMG_SIZE)
    img = img.astype(np.float32)
    img = img - 128
    img = img * 0.0078125
    img = np.expand_dims(img, axis=0)
    return img

def get_embedding(face_img):
    preprocessed = preprocess_face(face_img)
    interpreter.set_tensor(input_details[0]['index'], preprocessed)
    interpreter.invoke()
    embedding = interpreter.get_tensor(output_details[0]['index'])
    embedding = embedding[0]
    embedding = embedding / np.linalg.norm(embedding)
    return embedding

def cosine_similarity(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def eye_aspect_ratio(eye):
    A = np.linalg.norm(eye[1] - eye[5])
    B = np.linalg.norm(eye[2] - eye[4])
    C = np.linalg.norm(eye[0] - eye[3])
    ear = (A + B) / (2.0 * C)
    return ear

def count_blinks(frames):
    blink_count = 0
    counter = 0
    for frame in frames:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        rects = detector(gray, 0)
        for rect in rects:
            shape = predictor(gray, rect)
            shape_np = np.zeros((68, 2), dtype='int')
            for i in range(68):
                shape_np[i] = (shape.part(i).x, shape.part(i).y)
            leftEye = shape_np[42:48]
            rightEye = shape_np[36:42]
            leftEAR = eye_aspect_ratio(leftEye)
            rightEAR = eye_aspect_ratio(rightEye)
            ear = (leftEAR + rightEAR) / 2.0
            if ear < EAR_THRESHOLD:
                counter += 1
            else:
                if counter >= CONSEC_FRAMES:
                    blink_count += 1
                counter = 0
    return blink_count

def decrypt_image_to_cv2(filepath):
    with open(filepath, 'rb') as f:
        encrypted_bytes = f.read()
    image_bytes = fernet.decrypt(encrypted_bytes)
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

face_bp = Blueprint('face', __name__)

def handle_image_upload(request, user, is_reference=True):
    """Helper function to handle image upload logic for both reference and current photos"""
    print(f"\n=== {'REFERENCE' if is_reference else 'CURRENT'} PHOTO UPLOAD REQUEST ===")
    print(f"Headers: {dict(request.headers)}")
    print(f"Form data: {request.form}")
    print(f"Files: {request.files}")
    
    # Handle file upload
    if 'image' not in request.files and not request.data:
        print("Error: No image data in request")
        return None, 'No image file provided'
    
    image_bytes = None
    try:
        if 'image' in request.files:
            print("Processing file upload from form-data")
            image = request.files['image']
            if not image or image.filename == '':
                print("Error: No selected file")
                return None, 'No selected file'
            image_bytes = image.read()
            print(f"Read {len(image_bytes)} bytes from uploaded file")
        else:
            # Handle base64 encoded image
            print("Processing base64 encoded image")
            image_data = request.data
            if not image_data:
                print("Error: No image data in request body")
                return None, 'No image data provided'
            image_bytes = base64.b64decode(image_data)
            print(f"Decoded {len(image_bytes)} bytes from base64 data")
            
        if not image_bytes:
            print("Error: Failed to read image data")
            return None, 'Failed to read image data'
            
        # Generate appropriate filename with proper extension
        file_ext = '.jpg'  # Default to .jpg
        if 'image' in request.files:
            # Try to get the original extension if available
            original_filename = getattr(request.files['image'], 'filename', '')
            if '.' in original_filename:
                file_ext = os.path.splitext(original_filename)[1].lower()
                # Ensure it's a valid image extension
                if file_ext not in ['.jpg', '.jpeg', '.png']:
                    file_ext = '.jpg'  # Default to .jpg if invalid extension
        
        file_prefix = 'reference' if is_reference else 'current'
        filename = f"{file_prefix}_{user.id}{file_ext}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        print(f"Saving to: {filepath}")
        
        # Ensure upload directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Encrypt and save the image
        encrypted_bytes = fernet.encrypt(image_bytes)
        with open(filepath, 'wb') as f:
            f.write(encrypted_bytes)
            
        # Update user record
        if is_reference:
            user.reference_image = filename
        else:
            user.current_photo = filename
        db.session.commit()
        
        # Log the photo upload activity
        try:
            ip_address = request.remote_addr
            user_agent = request.headers.get('User-Agent')
            
            activity = ActivityLog(
                user_id=user.id,
                activity_type='photo_upload',
                details=f"{'Reference' if is_reference else 'Current'} photo uploaded",
                ip_address=ip_address,
                user_agent=user_agent,
                status='success'
            )
            db.session.add(activity)
            db.session.commit()
        except Exception as e:
            print(f"Error logging activity: {str(e)}")
        
        return {'filename': filename, 'filepath': filepath}, None
        
    except Exception as e:
        print(f"Error processing image: {str(e)}", exc_info=True)
        return None, f'Error processing image: {str(e)}'

@face_bp.route('/upload', methods=['POST'])
def upload_face():
    """Endpoint for uploading reference photos"""
    return handle_photo_upload(is_reference=True)

@face_bp.route('/upload/current', methods=['POST'])
def upload_current_face():
    """Endpoint for uploading current photos for verification"""
    return handle_photo_upload(is_reference=False)

def handle_photo_upload(is_reference=True):
    """Handle both reference and current photo uploads"""
    try:
        if not request.is_json and not request.form and not request.files:
            print("Error: No valid request data found")
            return jsonify({'error': 'Request must be JSON or form-data with file'}), 400
            
        # Handle both JSON and form-data
        email = None
        if request.is_json:
            print("Processing as JSON request")
            data = request.get_json(silent=True) or {}
            email = data.get('email')
        else:
            print("Processing as form-data request")
            email = request.form.get('email')
            
        print(f"Email from request: {email}")
            
        if not email:
            print("Error: No email provided")
            return jsonify({'error': 'Email is required'}), 400
            
        user = User.query.filter_by(email=email).first()
        if not user:
            print(f"Error: User not found with email {email}")
            return jsonify({'error': 'User not found'}), 404
        
        # Handle the actual image upload
        result, error = handle_image_upload(request, user, is_reference)
        if error:
            return jsonify({'error': error}), 400
            
        response_data = {
            'message': f"{'Reference' if is_reference else 'Current'} image uploaded successfully",
            'filename': result['filename'],
            'status': 'success'
        }
        print(f"Success: {response_data}")
        return jsonify(response_data), 200
            
    except Exception as e:
        print(f"Unexpected error in {'upload_face' if is_reference else 'upload_current_face'}: {str(e)}", exc_info=True)
        return jsonify({'error': 'An unexpected error occurred', 'details': str(e)}), 500

@face_bp.route('/verify', methods=['POST'])
def verify_face():
    try:
        print("\n=== FACE VERIFICATION REQUEST ===")
        print(f"Request form data: {request.form}")
        
        email = request.form.get('email')
        if not email:
            print("Error: No email provided")
            return jsonify({'error': 'Email is required'}), 400
            
        user = User.query.filter_by(email=email).first()
        if not user:
            print(f"Error: User not found with email {email}")
            return jsonify({'error': 'User not found'}), 404
            
        print(f"User found: ID={user.id}, Email={user.email}")
        print(f"Reference image: {user.reference_image}")
        print(f"Current photo: {user.current_photo}")
        
        if not user.reference_image or not user.current_photo:
            print("Error: Missing reference or current photo")
            return jsonify({
                'error': 'Reference or current photo not found for user',
                'has_reference': bool(user.reference_image),
                'has_current': bool(user.current_photo)
            }), 404
            
        # Build full file paths
        ref_path = os.path.join(UPLOAD_FOLDER, user.reference_image)
        cur_path = os.path.join(UPLOAD_FOLDER, user.current_photo)
        
        print(f"Reference image path: {ref_path}")
        print(f"Current photo path: {cur_path}")
        
        # Check if files exist
        if not os.path.exists(ref_path):
            print(f"Error: Reference image not found at {ref_path}")
            return jsonify({'error': f'Reference image not found at {ref_path}'}), 404
            
        if not os.path.exists(cur_path):
            print(f"Error: Current photo not found at {cur_path}")
            return jsonify({'error': f'Current photo not found at {cur_path}'}), 404
            
        # Try to decrypt and load images
        print("Decrypting reference image...")
        ref_img = decrypt_image_to_cv2(ref_path)
        print("Decrypting current photo...")
        cur_img = decrypt_image_to_cv2(cur_path)
        
        if ref_img is None or cur_img is None:
            print(f"Error: Could not load images. ref_img is None: {ref_img is None}, cur_img is None: {cur_img is None}")
            return jsonify({
                'error': 'Could not load images',
                'reference_loaded': ref_img is not None,
                'current_loaded': cur_img is not None
            }), 500
            
        print("Converting reference image to grayscale...")
        gray_ref = cv2.cvtColor(ref_img, cv2.COLOR_BGR2GRAY)
        cascade_path = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
        
        if not os.path.exists(cascade_path):
            print(f"Error: Face detection model not found at {cascade_path}")
            return jsonify({'error': 'Face detection model not found'}), 500
            
        print("Detecting face in reference image...")
        face_cascade = cv2.CascadeClassifier(cascade_path)
        faces_ref = face_cascade.detectMultiScale(gray_ref, 1.3, 5)
        
        if len(faces_ref) == 0:
            print("Error: No face detected in reference image")
            return jsonify({'error': 'No face in reference image'}), 400
            
        x, y, w, h = faces_ref[0]
        ref_face = ref_img[y:y+h, x:x+w]
        print("Extracting face embedding from reference image...")
        ref_embedding = get_embedding(ref_face)
        
        print("Processing current photo...")
        gray_cur = cv2.cvtColor(cur_img, cv2.COLOR_BGR2GRAY)
        faces_cur = face_cascade.detectMultiScale(gray_cur, 1.3, 5)
        
        if len(faces_cur) == 0:
            print("Error: No face detected in current photo")
            return jsonify({'error': 'No face in current photo'}), 400
            
        x, y, w, h = faces_cur[0]
        cur_face = cur_img[y:y+h, x:x+w]
        print("Extracting face embedding from current photo...")
        cur_embedding = get_embedding(cur_face)
        
        print("Calculating similarity score...")
        sim = cosine_similarity(ref_embedding, cur_embedding)
        
        # Log verification activity
        verification_status = 'success' if sim > SIMILARITY_THRESHOLD else 'failure'
        try:
            ip_address = request.remote_addr
            user_agent = request.headers.get('User-Agent')
            
            activity = ActivityLog(
                user_id=user.id,
                activity_type='face_verification',
                details=f'Similarity score: {sim}',
                ip_address=ip_address,
                user_agent=user_agent,
                status=verification_status
            )
            db.session.add(activity)
            db.session.commit()
        except Exception as e:
            print(f"Error logging activity: {str(e)}")
            
        if sim > SIMILARITY_THRESHOLD:
            print(f"Verification successful! Similarity score: {sim}")
            return jsonify({'verified': True, 'similarity': float(sim)}), 200
        else:
            print(f"Verification failed. Similarity score: {sim} (threshold: {SIMILARITY_THRESHOLD})")
            review = ManualReview(
                user_id=user.id,
                failure_type='verification',
                details=f'similarity: {sim}'
            )
            db.session.add(review)
            db.session.commit()
            return jsonify({
                'verified': False, 
                'similarity': float(sim),
                'admin_required': True
            }), 200
            
    except Exception as e:
        print(f"Error in verify_face: {str(e)}", exc_info=True)
        return jsonify({'error': f'Error during verification: {str(e)}'}), 500

@face_bp.route('/liveness', methods=['POST'])
def liveness_check():
    email = request.form.get('email')
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    user = User.query.filter_by(email=email).first()
    if not user or not user.reference_image:
        return jsonify({'error': 'Reference image not found for user'}), 404
    if 'video' not in request.files:
        return jsonify({'error': 'No video uploaded'}), 400
    video = request.files['video']
    filename = f'liveness_{user.id}.mp4'
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    video.save(filepath)

    cap = cv2.VideoCapture(filepath)
    frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)
    cap.release()

    blink_count = 0
    counter = 0
    face_found = False
    for frame in frames:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        rects = detector(gray, 0)
        if len(rects) == 0:
            continue
        face_found = True
        for rect in rects:
            shape = predictor(gray, rect)
            shape_np = np.zeros((68, 2), dtype='int')
            for i in range(68):
                shape_np[i] = (shape.part(i).x, shape.part(i).y)
            leftEye = shape_np[42:48]
            rightEye = shape_np[36:42]
            leftEAR = eye_aspect_ratio(leftEye)
            rightEAR = eye_aspect_ratio(rightEye)
            ear = (leftEAR + rightEAR) / 2.0
            if ear < EAR_THRESHOLD:
                counter += 1
            else:
                if counter >= CONSEC_FRAMES:
                    blink_count += 1
                counter = 0

    if not face_found:
        review = ManualReview(
            user_id=user.id,
            failure_type='liveness',
            details='No face detected'
        )
        db.session.add(review)
        db.session.commit()
        return jsonify({'liveness': False, 'blinks': 0, 'reason': 'No face detected', 'admin_required': True}), 200

    # Log liveness check activity
    liveness_status = 'success' if blink_count >= 2 else 'failure'
    try:
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent')
        
        activity = ActivityLog(
            user_id=user.id,
            activity_type='liveness_check',
            details=f'Blink count: {blink_count}',
            ip_address=ip_address,
            user_agent=user_agent,
            status=liveness_status
        )
        db.session.add(activity)
        db.session.commit()
    except Exception as e:
        print(f"Error logging activity: {str(e)}")
    
    if blink_count >= 2:
        return jsonify({'liveness': True, 'blinks': blink_count}), 200
    else:
        review = ManualReview(
            user_id=user.id,
            failure_type='liveness',
            details=f'blinks: {blink_count}'
        )
        db.session.add(review)
        db.session.commit()
        return jsonify({'liveness': False, 'blinks': blink_count, 'admin_required': True}), 200

@face_bp.route('/photo_upload', methods=['POST'])
def photo_upload():
    email = request.form.get('email')
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    image = request.files['image']
    filename = f"current_{user.id}.jpg"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    image_bytes = image.read()
    encrypted_bytes = fernet.encrypt(image_bytes)
    with open(filepath, 'wb') as f:
        f.write(encrypted_bytes)
    user.current_photo = filename
    db.session.commit()
    return jsonify({'message': 'Current photo uploaded', 'filename': filename}), 200
