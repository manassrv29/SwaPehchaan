from flask import Blueprint, jsonify, request
from models import db, ManualReview, User, Notification, ActivityLog
from sqlalchemy import func
from datetime import datetime, timedelta
from routes.auth import require_session

admin_bp = Blueprint('admin', __name__)

def require_admin(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'user') or request.user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated

@admin_bp.route('/admin/reviews', methods=['GET'])
@require_session
@require_admin
def get_pending_reviews():
    reviews = ManualReview.query.filter_by(status='pending').all()
    result = []
    for review in reviews:
        user = User.query.get(review.user_id)
        result.append({
            'review_id': review.id,
            'user_email': user.email,
            'failure_type': review.failure_type,
            'details': review.details,
            'created_at': review.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'status': review.status
        })
    return jsonify(result), 200

@admin_bp.route('/admin/user/<int:user_id>', methods=['GET'])
@require_session
@require_admin
def get_user_details(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    reviews = ManualReview.query.filter_by(user_id=user_id).all()
    review_history = [
        {
            'review_id': r.id,
            'failure_type': r.failure_type,
            'details': r.details,
            'status': r.status,
            'created_at': r.created_at.strftime('%Y-%m-%d %H:%M:%S')
        } for r in reviews
    ]
    user_data = {
        'id': user.id,
        'email': user.email,
        'certificate_data': user.certificate_data,
        'certificate_submitted_at': user.certificate_submitted_at.isoformat() if user.certificate_submitted_at else None,
        'reference_image': user.reference_image,
        'current_photo': user.current_photo,
        'manual_review_history': review_history
    }
    return jsonify(user_data), 200

@admin_bp.route('/admin/stats', methods=['GET'])
@require_session
@require_admin
def get_dashboard_stats():
    total_users = User.query.count()
    pending_reviews = ManualReview.query.filter_by(status='pending').count()
    now = datetime.utcnow()
    start_of_month = datetime(now.year, now.month, 1)
    successful_submissions = User.query.filter(
        User.certificate_submitted_at != None,
        User.certificate_submitted_at >= start_of_month
    ).count()
    stats = {
        'total_users': total_users,
        'pending_manual_reviews': pending_reviews,
        'successful_submissions_this_month': successful_submissions
    }
    return jsonify(stats), 200

@admin_bp.route('/admin/review/<int:review_id>', methods=['POST'])
@require_session
@require_admin
def update_review_status(review_id):
    data = request.get_json()
    status = data.get('status')
    if status not in ['pending', 'reviewed', 'approved', 'rejected']:
        return jsonify({'error': 'Invalid status'}), 400
    review = ManualReview.query.get(review_id)
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    review.status = status
    db.session.commit()
    if status in ['approved', 'rejected']:
        notif_msg = f"Your manual review (ID: {review.id}) has been {status}."
        notification = Notification(user_id=review.user_id, message=notif_msg)
        db.session.add(notification)
    db.session.commit()
    return jsonify({'message': 'Review status updated'}), 200

@admin_bp.route('/admin/activities', methods=['GET'])
@require_session
@require_admin
def get_all_activities():
    # Get query parameters for filtering
    user_id = request.args.get('user_id', type=int)
    activity_type = request.args.get('activity_type')
    status = request.args.get('status')
    days = request.args.get('days', type=int, default=30)  # Default to last 30 days
    
    # Start with base query
    query = ActivityLog.query
    
    # Apply filters if provided
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    if activity_type:
        query = query.filter(ActivityLog.activity_type == activity_type)
    if status:
        query = query.filter(ActivityLog.status == status)
    
    # Filter by date range
    if days:
        start_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(ActivityLog.created_at >= start_date)
    
    # Order by most recent first
    activities = query.order_by(ActivityLog.created_at.desc()).all()
    
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
            'created_at': activity.created_at.isoformat()
        })
    
    return jsonify({'activities': result}), 200

def send_certificate_due_notifications():
    soon = datetime.utcnow() + timedelta(days=7)
    users = User.query.filter(
        User.certificate_submitted_at != None
    ).all()
    for user in users:
        due_date = user.certificate_submitted_at + timedelta(days=365)
        days_left = (due_date - datetime.utcnow()).days
        if 0 < days_left <= 7:
            message = f"Your certificate will be due in {days_left} days. Please prepare to resubmit."
            exists = Notification.query.filter_by(user_id=user.id, message=message).first()
            if not exists:
                notification = Notification(user_id=user.id, message=message)
                db.session.add(notification)
    db.session.commit()