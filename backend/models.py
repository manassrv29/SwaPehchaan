from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
import secrets

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(10), nullable=False)  # 'user' or 'admin'
    password_hash = db.Column(db.String(256), nullable=True)  # Added for password authentication
    public_key = db.Column(db.Text, nullable=False)
    private_key_encrypted = db.Column(db.Text, nullable=False)
    challenge_phrase_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    reference_image = db.Column(db.String(256), nullable=True)
    current_photo = db.Column(db.String(256), nullable=True)
    certificate_data = db.Column(db.Text, nullable=True)
    certificate_submitted_at = db.Column(db.DateTime, nullable=True)
    last_login = db.Column(db.DateTime, nullable=True)  # Track last login time

class Session(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    session_token = db.Column(db.String(128), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    user = db.relationship('User', backref=db.backref('sessions', lazy=True))

class ManualReview(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    failure_type = db.Column(db.String(32), nullable=False)
    details = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(32), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref=db.backref('manual_reviews', lazy=True))

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.String(512), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    read = db.Column(db.Boolean, default=False)
    user = db.relationship('User', backref=db.backref('notifications', lazy=True))

class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    activity_type = db.Column(db.String(50), nullable=False)  # login, photo_upload, verification, liveness_check, etc.
    details = db.Column(db.Text, nullable=True)  # Additional details about the activity
    ip_address = db.Column(db.String(50), nullable=True)  # IP address of the user
    user_agent = db.Column(db.String(256), nullable=True)  # User agent information
    status = db.Column(db.String(20), nullable=False)  # success, failure, pending
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref=db.backref('activities', lazy=True))
