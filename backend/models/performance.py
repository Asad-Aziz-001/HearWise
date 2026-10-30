from . import db
from datetime import datetime

class PerformanceSummary(db.Model):
    __tablename__ = 'performance_summary'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sound_contrast = db.Column(db.String(50))
    total_attempts = db.Column(db.Integer, default=0)
    correct_attempts = db.Column(db.Integer, default=0)
    avg_response_time_ms = db.Column(db.Integer, default=0)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Recommendation(db.Model):
    __tablename__ = 'recommendations'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    recommended_game_type = db.Column(db.String(30))
    recommended_difficulty = db.Column(db.String(10))
    focus_area = db.Column(db.String(100))
    reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Achievement(db.Model):
    __tablename__ = 'achievements'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    badge_name = db.Column(db.String(100))
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)