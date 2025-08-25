from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import socket
from datetime import datetime

# Import blueprints from their respective modules
from routes.face import face_bp
from routes.auth import auth_bp
from routes.certificate import certificate_bp
from routes.admin import admin_bp
from routes.notifications import notifications_bp
from routes.activity import activity_bp

from models import db

app = Flask(__name__)

# Configure CORS to allow all origins
app.config['CORS_HEADERS'] = 'Content-Type'
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Add request logging middleware
@app.before_request
def log_request_info():
    app.logger.debug('\n=== REQUEST ===')
    app.logger.debug('Headers: %s', request.headers)
    app.logger.debug('Method: %s', request.method)
    app.logger.debug('Path: %s', request.path)
    app.logger.debug('Content-Type: %s', request.content_type)
    
    # Log form data if present
    if request.form:
        app.logger.debug('Form data: %s', dict(request.form))
    
    # Log files if present
    if request.files:
        app.logger.debug('Files: %s', {k: v.filename for k, v in request.files.items()})
    
    # Log JSON data if present
    if request.is_json:
        app.logger.debug('JSON data: %s', request.get_json(silent=True) or {})

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///swapehchaan.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

app.register_blueprint(auth_bp)
app.register_blueprint(face_bp)
app.register_blueprint(certificate_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(activity_bp)

from sqlalchemy import text

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for connectivity testing"""
    try:
        # Test database connection with proper SQLAlchemy text()
        db.session.execute(text('SELECT 1'))
        db_status = 'connected'
    except Exception as e:
        db_status = f'error: {str(e)}'
    
    return jsonify({
        'status': 'healthy',
        'service': 'swaphechaan-backend',
        'timestamp': datetime.utcnow().isoformat(),
        'server_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'hostname': socket.gethostname(),
        'ip_address': socket.gethostbyname(socket.gethostname()),
        'database': db_status,
        'endpoints': {
            'upload': f'http://{socket.gethostbyname(socket.gethostname())}:5001/upload',
            'verify': f'http://{socket.gethostbyname(socket.gethostname())}:5001/verify'
        }
    }), 200

if __name__ == '__main__':
    # Enable debug logging
    import logging
    logging.basicConfig(level=logging.DEBUG)
    
    # Configure Flask app logging
    app.logger.setLevel(logging.DEBUG)
    
    # Get the local IP address
    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    
    print(f"\n=== SERVER STARTING ===")
    print(f"Local URL: http://127.0.0.1:5001")
    print(f"Network URL: http://{local_ip}:5001")
    print("====================\n")
    
    # Run the app on all network interfaces
    app.run(debug=True, host='0.0.0.0', port=5001, ssl_context=None)
