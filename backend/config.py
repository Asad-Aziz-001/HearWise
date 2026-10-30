import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'hearwise.db')

# ⚠️ HARDCODED — never change these after first run!
FIXED_SECRET_KEY = 'hearwise-super-secret-key-2026-fixed-never-change-this-abc123xyz'
FIXED_JWT_SECRET = 'hearwise-jwt-secret-key-2026-fixed-never-change-this-long-string-xyz789'


class Config:
    SECRET_KEY = FIXED_SECRET_KEY
    JWT_SECRET_KEY = FIXED_JWT_SECRET
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{DB_PATH}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = False
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    AUDIO_FOLDER = os.path.join(BASE_DIR, 'static', 'audio')