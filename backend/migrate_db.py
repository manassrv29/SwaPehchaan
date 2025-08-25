"""
Database migration script to update the database schema with new models
"""
from main import app
from models import db, ActivityLog, User
from datetime import datetime
import sys
from sqlalchemy import inspect, text

def migrate_database():
    """
    Perform database migration to add new tables and columns
    """
    print("Starting database migration...")
    
    with app.app_context():
        try:
            # Get inspector
            inspector = inspect(db.engine)
            
            # Check if ActivityLog table exists
            activity_table_exists = inspector.has_table('activity_log')
            
            # Check if User.last_login and User.password_hash columns exist
            user_has_last_login = False
            user_has_password_hash = False
            if inspector.has_table('user'):
                columns = [col['name'] for col in inspector.get_columns('user')]
                user_has_last_login = 'last_login' in columns
                user_has_password_hash = 'password_hash' in columns
            
            # Create tables if they don't exist
            if not activity_table_exists:
                print("Creating ActivityLog table...")
                db.create_all()
                print("ActivityLog table created successfully.")
            else:
                print("ActivityLog table already exists.")
            
            # Add last_login column to User table if it doesn't exist
            if not user_has_last_login:
                print("Adding last_login column to User table...")
                with db.engine.connect() as conn:
                    conn.execute(text('ALTER TABLE user ADD COLUMN last_login DATETIME'))
                    conn.commit()
                print("last_login column added successfully.")
            else:
                print("last_login column already exists in User table.")
                
            # Add password_hash column to User table if it doesn't exist
            if not user_has_password_hash:
                print("Adding password_hash column to User table...")
                with db.engine.connect() as conn:
                    conn.execute(text('ALTER TABLE user ADD COLUMN password_hash VARCHAR(256)'))
                    conn.commit()
                print("password_hash column added successfully.")
            else:
                print("password_hash column already exists in User table.")
            
            print("Migration completed successfully!")
            return True
            
        except Exception as e:
            print(f"Error during migration: {str(e)}")
            return False

if __name__ == "__main__":
    success = migrate_database()
    sys.exit(0 if success else 1)
