import os

class Config:
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = True
    
    # Database settings
    DATABASE_PATH = 'database/funnel.db'
    
    # File paths
    STATIC_FOLDER = 'static'
    TEMPLATES_FOLDER = 'templates'
    PAGES_FOLDER = 'pages'
    ADMIN_FOLDER = 'admin'
    
    # Available dates for calendar (August 2025)
    AVAILABLE_DATES = [21, 22, 23, 24]
    AVAILABLE_MONTH = 7  # August (0-indexed)
    AVAILABLE_YEAR = 2025
    
    # Time slots
    TIME_SLOTS = [
        '10:30', '10:45', '11:00', '11:15', 
        '11:30', '11:45', '12:00'
    ]
    
    # Default timezone
    DEFAULT_TIMEZONE = 'Europe/Moscow'
    
    # Email validation
    EMAIL_REGEX = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    
    # Form validation
    REQUIRED_FIELDS = {
        'lead': ['firstName', 'email'],
        'appointment': ['name', 'email', 'phone', 'website', 'revenue']
    }
    
    # Email settings
    SMTP_SERVER = os.environ.get('SMTP_SERVER') or 'smtp.gmail.com'
    SMTP_PORT = int(os.environ.get('SMTP_PORT') or 587)
    SENDER_EMAIL = os.environ.get('SENDER_EMAIL') or 'your-email@gmail.com'
    SENDER_PASSWORD = os.environ.get('SENDER_PASSWORD') or 'your-app-password'
    USE_TLS = os.environ.get('USE_TLS', 'True').lower() == 'true'
    ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL') or 'admin@example.com'
    
    # Google Calendar settings
    GOOGLE_CALENDAR_ID = os.environ.get('GOOGLE_CALENDAR_ID') or 'primary'
    GOOGLE_CREDENTIALS_FILE = 'database/credentials.json'
    GOOGLE_TOKEN_FILE = 'database/token.json'
    
    # Appointment settings
    APPOINTMENT_DURATION_MINUTES = 60
    REMINDER_EMAIL_HOURS_BEFORE = 24  # Send reminder 24 hours before
    CONFIRMATION_EMAIL_ENABLED = True
    REMINDER_EMAIL_ENABLED = True
    ADMIN_NOTIFICATION_ENABLED = True 