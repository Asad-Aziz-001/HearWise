"""
Tracks recently used words/pairs to avoid repeats.
Uses in-memory cache (fast, simple).
For production, use Redis/DB.
"""

from collections import defaultdict
from datetime import datetime, timedelta

class WordHistory:
    """Track recently used words to avoid repeats."""
    
    def __init__(self, max_history=500):  # 500 entries per game
        self.max_history = max_history
        # {user_id_game_type: [(word_pair, timestamp), ...]}
        self.history = defaultdict(list)
    
    def is_recent(self, user_id, game_type, item_key):
        """Check if item was used recently."""
        key = f"{user_id}_{game_type}"
        cutoff = datetime.now() - timedelta(hours=7)  # 7 days (better anti-repeat)
        recent_items = [
            item for item, ts in self.history[key]
            if ts > cutoff and item == item_key
        ]
        return len(recent_items) > 0
    
    def add(self, user_id, game_type, item_key):
        """Record item usage."""
        key = f"{user_id}_{game_type}"
        self.history[key].append((item_key, datetime.now()))
        
        # Trim old entries
        if len(self.history[key]) > self.max_history:
            self.history[key] = self.history[key][-self.max_history:]
    
    def clear_old(self):
        """Clean entries older than 24 hours."""
        cutoff = datetime.now() - timedelta(hours=24)
        for key in self.history:
            self.history[key] = [
                (item, ts) for item, ts in self.history[key] if ts > cutoff
            ]

# Global instance
word_history = WordHistory()