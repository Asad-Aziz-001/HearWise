"""
Content Models — Master content management for all games.
"""

from . import db
from datetime import datetime


class ContentWordPair(db.Model):
    """Word pairs for Similar Sounds, Word in Noise games."""
    __tablename__ = 'content_word_pairs'
    
    id = db.Column(db.Integer, primary_key=True)
    word1 = db.Column(db.String(100), nullable=False)
    word2 = db.Column(db.String(100), nullable=False)
    sound_contrast = db.Column(db.String(100))
    category = db.Column(db.String(20), default='consonant')  # vowel/consonant
    difficulty = db.Column(db.String(20), default='easy')     # easy/medium/hard
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'word1': self.word1,
            'word2': self.word2,
            'sound_contrast': self.sound_contrast,
            'category': self.category,
            'difficulty': self.difficulty,
            'is_active': self.is_active,
        }


class ContentSentence(db.Model):
    """Sentences for Word Position, Audio Story games."""
    __tablename__ = 'content_sentences'
    
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50))  # story/simple/complex
    difficulty = db.Column(db.String(20), default='easy')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'category': self.category,
            'difficulty': self.difficulty,
            'is_active': self.is_active,
        }


class ContentEmotion(db.Model):
    """Emotional sentences for Emotion Detection game."""
    __tablename__ = 'content_emotions'
    
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    emotion = db.Column(db.String(20), nullable=False)  # happy/sad/angry/neutral
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'emotion': self.emotion,
            'is_active': self.is_active,
        }


class ContentPhoneme(db.Model):
    """Phoneme transformations for Phoneme Replacement game."""
    __tablename__ = 'content_phonemes'
    
    id = db.Column(db.Integer, primary_key=True)
    original_word = db.Column(db.String(100), nullable=False)
    new_word = db.Column(db.String(100), nullable=False)
    sound_change = db.Column(db.String(100))
    difficulty = db.Column(db.String(20), default='easy')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'original_word': self.original_word,
            'new_word': self.new_word,
            'sound_change': self.sound_change,
            'difficulty': self.difficulty,
            'is_active': self.is_active,
        }


class ContentRhymePair(db.Model):
    """Rhyme pairs for Rhyme Match game."""
    __tablename__ = 'content_rhyme_pairs'
    
    id = db.Column(db.Integer, primary_key=True)
    word1 = db.Column(db.String(100), nullable=False)
    word2 = db.Column(db.String(100), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'word1': self.word1,
            'word2': self.word2,
            'is_active': self.is_active,
        }


class ContentWordChain(db.Model):
    """Chains for Word Chain Memory game."""
    __tablename__ = 'content_word_chains'
    
    id = db.Column(db.Integer, primary_key=True)
    words = db.Column(db.Text, nullable=False)  # JSON array or comma-separated
    difficulty = db.Column(db.String(20), default='easy')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'words': self.words,
            'difficulty': self.difficulty,
            'is_active': self.is_active,
        }