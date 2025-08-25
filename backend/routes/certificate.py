from flask import Blueprint, request, jsonify
from models import db, User, ActivityLog
from datetime import datetime
from routes.auth import require_session

certificate_bp = Blueprint('certificate', __name__)

@certificate_bp.route('/submit', methods=['POST'])
@require_session
def submit_certificate():
    print("\n=== CERTIFICATE SUBMISSION REQUEST ===")
    print(f"Headers: {dict(request.headers)}")
    print(f"Content-Type: {request.content_type}")
    
    data = request.get_json()
    print(f"Request data: {data}")
    
    email = data.get('email')
    certificate_data = data.get('certificate_data')
    similarity_score = data.get('similarity_score', 0)
    verification_status = data.get('verification_status', 'unknown')
    
    print(f"Processing certificate for email: {email}")
    
    if not email or not certificate_data:
        print("Error: Missing email or certificate_data")
        return jsonify({'error': 'Email and certificate_data are required'}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user:
        print(f"Error: User not found with email: {email}")
        return jsonify({'error': 'User not found'}), 404
    
    print(f"Found user: {user.email} (ID: {user.id})")
    user.certificate_data = certificate_data
    user.certificate_submitted_at = datetime.utcnow()  # Store the current timestamp
    db.session.commit()
    
    # Log certificate submission activity with enhanced details
    try:
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent')
        
        details = f'Life certificate submitted successfully. Face verification: {verification_status}. Similarity score: {similarity_score:.2%}'
        
        print(f"Creating activity log: {details}")
        
        activity = ActivityLog(
            user_id=user.id,
            activity_type='certificate_submission',
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            status='success'
        )
        db.session.add(activity)
        db.session.commit()
        print(f"Activity logged successfully for user {user.id}")
    except Exception as e:
        print(f"Error logging activity: {str(e)}")
    
    print(f"Certificate submission completed for {email}")
    return jsonify({'message': 'Certificate submitted successfully', 'submitted_at': user.certificate_submitted_at.isoformat()}), 200