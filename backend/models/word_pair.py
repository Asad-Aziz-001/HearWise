from . import db
from datetime import datetime

class WordPair(db.Model):
    __tablename__ = 'word_pairs'
    id = db.Column(db.Integer, primary_key=True)
    pair_code = db.Column(db.String(10), unique=True, nullable=False)
    word1 = db.Column(db.String(50), nullable=False)
    word2 = db.Column(db.String(50), nullable=False)
    sound_contrast = db.Column(db.String(50))
    category = db.Column(db.String(20), nullable=False)      # 'vowel' | 'consonant'
    difficulty = db.Column(db.String(10), nullable=False)    # 'easy' | 'medium' | 'hard'
    audio1_path = db.Column(db.String(255))
    audio2_path = db.Column(db.String(255))
    status = db.Column(db.String(20), default='pending')     # 'pending' | 'approved'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'pair_code': self.pair_code,
            'word1': self.word1, 'word2': self.word2,
            'sound_contrast': self.sound_contrast,
            'category': self.category, 'difficulty': self.difficulty,
            'audio1': self.audio1_path, 'audio2': self.audio2_path
        }