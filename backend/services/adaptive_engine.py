"""
HearWise Adaptive Engine - Rule-Based Implementation
Adjusts difficulty based on accuracy, response time, and error patterns.
"""

class AdaptiveEngine:
    # Thresholds (from project spec)
    ACCURACY_UPGRADE = 0.80      # 80%+ accuracy → increase difficulty
    ACCURACY_DOWNGRADE = 0.50    # <50% accuracy → decrease difficulty
    RESPONSE_TIME_FAST = 3000    # ms - fast response
    RESPONSE_TIME_SLOW = 7000    # ms - slow response
    MIN_ATTEMPTS = 5             # avoid changing based on single response

    DIFFICULTY_ORDER = ['easy', 'medium', 'hard']

    @staticmethod
    def calculate_accuracy(recent_attempts):
        if not recent_attempts:
            return 0.0
        correct = sum(1 for a in recent_attempts if a['is_correct'])
        return correct / len(recent_attempts)

    @staticmethod
    def calculate_avg_response_time(recent_attempts):
        if not recent_attempts:
            return 0
        times = [a['response_time_ms'] for a in recent_attempts if a['response_time_ms']]
        return sum(times) / len(times) if times else 0

    @classmethod
    def adjust_difficulty(cls, current_difficulty, recent_attempts):
        """Returns new difficulty based on recent performance."""
        if len(recent_attempts) < cls.MIN_ATTEMPTS:
            return current_difficulty  # not enough data

        accuracy = cls.calculate_accuracy(recent_attempts)
        avg_rt = cls.calculate_avg_response_time(recent_attempts)
        idx = cls.DIFFICULTY_ORDER.index(current_difficulty)

        # Upgrade: high accuracy + reasonable speed
        if accuracy >= cls.ACCURACY_UPGRADE and avg_rt < cls.RESPONSE_TIME_SLOW:
            new_idx = min(idx + 1, len(cls.DIFFICULTY_ORDER) - 1)
            return cls.DIFFICULTY_ORDER[new_idx]

        # Downgrade: low accuracy
        if accuracy < cls.ACCURACY_DOWNGRADE:
            new_idx = max(idx - 1, 0)
            return cls.DIFFICULTY_ORDER[new_idx]

        return current_difficulty

    @staticmethod
    def find_weak_contrasts(performance_records, threshold=0.6):
        """Find sound contrasts where user accuracy is below threshold."""
        weak = []
        for rec in performance_records:
            if rec.total_attempts >= 3:
                acc = rec.correct_attempts / rec.total_attempts
                if acc < threshold:
                    weak.append({
                        'sound_contrast': rec.sound_contrast,
                        'accuracy': round(acc * 100, 1),
                        'attempts': rec.total_attempts
                    })
        return sorted(weak, key=lambda x: x['accuracy'])

    @classmethod
    def generate_recommendation(cls, weak_contrasts, current_difficulty):
        """Generate next-practice recommendation based on weak areas."""
        if not weak_contrasts:
            return {
                'focus_area': 'general practice',
                'difficulty': current_difficulty,
                'reason': 'Keep practicing to maintain your progress!'
            }
        top_weak = weak_contrasts[0]
        return {
            'focus_area': top_weak['sound_contrast'],
            'difficulty': 'easy' if top_weak['accuracy'] < 50 else current_difficulty,
            'reason': f"You're at {top_weak['accuracy']}% on '{top_weak['sound_contrast']}'. "
                      f"Extra practice here will help."
        }