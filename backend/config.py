import os
from datetime import timedelta
from urllib.parse import quote_plus
from dotenv import load_dotenv

# Search for .env in project root or current dir
root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env'))
if os.path.exists(root_env):
    load_dotenv(root_env)
else:
    load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-secret-key-christ-2026')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default-jwt-secret-christ-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)

    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
    DB_PORT = os.getenv('DB_PORT', '3306')
    DB_NAME = os.getenv('DB_NAME', 'event_volunteer_ledger')

    # URL-encode password to support special characters
    encoded_password = quote_plus(DB_PASSWORD)
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        "?charset=utf8mb4"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_recycle": 280,
        "pool_pre_ping": True,
    }

    CERTIFICATES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'static', 'certificates'))
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
