from . import db
from datetime import datetime

class GameSession(db.Model):
    __tablename__ = 'game_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    game_type = db.Column(db.String(30))                      # 'word_discrimination' | 'sequence_memory'
    difficulty_level = db.Column(db.String(10))               # 'easy' | 'medium' | 'hard'
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime)
    total_questions = db.Column(db.Integer, default=0)
    correct_answers = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id, 'game_type': self.game_type,
            'difficulty_level': self.difficulty_level,
            'started_at': self.started_at.isoformat(),
            'total_questions': self.total_questions,
            'correct_answers': self.correct_answers
        }

class Attempt(db.Model):
    __tablename__ = 'attempts'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('game_sessions.id'))
    question_id = db.Column(db.Integer)
    word_pair_id = db.Column(db.Integer, db.ForeignKey('word_pairs.id'))
    user_answer = db.Column(db.String(100))
    is_correct = db.Column(db.Boolean)
    response_time_ms = db.Column(db.Integer)
    attempted_at = db.Column(db.DateTime, default=datetime.utcnow)