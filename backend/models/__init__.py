from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User
from .word_pair import WordPair
from .game import GameSession, Attempt
from .performance import PerformanceSummary, Recommendation, Achievement
from .content import (
    ContentWordPair, ContentSentence, ContentEmotion,
    ContentPhoneme, ContentRhymePair, ContentWordChain
)