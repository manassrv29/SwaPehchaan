from flask import Blueprint, request, jsonify
from models import db, ActivityLog, User
from routes.auth import require_session
from datetime import datetime

activity_bp = Blueprint('activity', __name__)

def log_activity(user_id, activity_type, details=None, status="success"):
    """Helper function to log user activities"""
    try:
        # Get IP address and user agent from request
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent')
        
        # Create activity log entry
        activity = ActivityLog(
            user_id=user_id,
            activity_type=activity_type,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status
        )
        
        db.session.add(activity)
        db.session.commit()
        return True
    except Exception as e:
        print(f"Error logging activity: {str(e)}")
        db.session.rollback()
        return False

@activity_bp.route('/activities', methods=['GET'])
@require_session
def get_user_activities():
    """Get activities for the current user"""
    user = request.user
    
    # Optional query parameters
    limit = request.args.get('limit', 20, type=int)
    offset = request.args.get('offset', 0, type=int)
    activity_type = request.args.get('type')
    
    # Build query
    query = ActivityLog.query.filter_by(user_id=user.id)
    
    # Filter by activity type if provided
    if activity_type:
        query = query.filter_by(activity_type=activity_type)
    
    # Order by most recent first
    query = query.order_by(ActivityLog.created_at.desc())
    
    # Apply pagination
    activities = query.limit(limit).offset(offset).all()
    
    # Format response
    result = []
    for activity in activities:
        result.append({
            'id': activity.id,
            'activity_type': activity.activity_type,
            'details': activity.details,
            'status': activity.status,
            'created_at': activity.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'ip_address': activity.ip_address
        })
    
    return jsonify({'activities': result}), 200

@activity_bp.route('/admin/activities', methods=['GET'])
@require_session
def get_all_activities():
    """Admin endpoint to get activities for all users or a specific user"""
    # Check if user is admin
    if not hasattr(request, 'user') or request.user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    # Optional query parameters
    user_id = request.args.get('user_id', type=int)
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    activity_type = request.args.get('type')
    
    # Build query
    query = ActivityLog.query
    
    # Filter by user_id if provided
    if user_id:
        query = query.filter_by(user_id=user_id)
    
    # Filter by activity type if provided
    if activity_type:
        query = query.filter_by(activity_type=activity_type)
    
    # Order by most recent first
    query = query.order_by(ActivityLog.created_at.desc())
    
    # Apply pagination
    activities = query.limit(limit).offset(offset).all()
    
    # Format response with user information
    result = []
    for activity in activities:
        user = User.query.get(activity.user_id)
        result.append({
            'id': activity.id,
            'user_id': activity.user_id,
            'user_email': user.email if user else 'Unknown',
            'activity_type': activity.activity_type,
            'details': activity.details,
            'ip_address': activity.ip_address,
            'user_agent': activity.user_agent,
            'status': activity.status,
            'created_at': activity.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    return jsonify(result), 200
