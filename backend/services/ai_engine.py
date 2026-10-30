"""
HearWise AI Engine
==================
Deep Analysis + Smart Recommendations for Adaptive Learning

Features:
1. AI Performance Analysis — deep insights from user's full history
2. AI-Recommended Games — suggests best next activity
3. Adaptive Difficulty — weighted scoring for level decisions
4. Personalized Progress Summary — user-friendly feedback

This is a rule-based expert system with weighted scoring.
Explainable, deterministic, no training data needed.
"""

from datetime import datetime, timedelta
from collections import Counter
import statistics


class AIEngine:
    """
    AI Engine for HearWise.
    Uses weighted scoring + pattern recognition for intelligent decisions.
    """

    # ============ THRESHOLDS ============
    ACCURACY_UPGRADE = 0.80        # upgrade difficulty if >= 80%
    ACCURACY_DOWNGRADE = 0.50      # downgrade if < 50%
    RESPONSE_TIME_FAST = 3000      # ms (3 seconds)
    RESPONSE_TIME_SLOW = 7000      # ms (7 seconds)
    MIN_ATTEMPTS = 5                # need at least 5 for decisions
    WEAK_AREA_THRESHOLD = 0.60     # < 60% = weak area
    STRONG_AREA_THRESHOLD = 0.75   # >= 75% = strength

    DIFFICULTY_ORDER = ['easy', 'medium', 'hard']

    # ============ 1. AI PERFORMANCE ANALYSIS ============
    @classmethod
    def analyze_performance(cls, sessions, sound_performance):
        """
        Deep analysis of user's performance.
        Returns comprehensive insights for the dashboard.
        """
        if not sessions:
            return {
                'has_data': False,
                'message': 'Play a game to see AI analysis.',
                'insights': [],
                'weak_areas': [],
                'strengths': [],
                'trend': {'direction': 'no_data', 'change': 0},
                'total_sessions': 0,
                'avg_accuracy': 0,
            }

        # Overall metrics
        total_sessions = len(sessions)
        accuracies = [
            (s.correct_answers / s.total_questions * 100)
            for s in sessions if s.total_questions and s.total_questions > 0
        ]
        avg_accuracy = statistics.mean(accuracies) if accuracies else 0

        # Trend analysis
        trend = cls._calculate_trend(sessions)

        # Weak areas
        weak_areas = cls._find_weak_contrasts(sound_performance)

        # Strengths
        strengths = cls._find_strengths(sound_performance)

        # Error patterns
        error_patterns = cls._detect_error_patterns(sessions)

        # Speed analysis
        speed_analysis = cls._analyze_response_time(sound_performance)

        # Generate insights
        insights = cls._generate_insights(
            avg_accuracy, trend, weak_areas, strengths,
            speed_analysis, total_sessions
        )

        return {
            'has_data': True,
            'total_sessions': total_sessions,
            'avg_accuracy': round(avg_accuracy, 1),
            'trend': trend,
            'weak_areas': weak_areas,
            'strengths': strengths,
            'error_patterns': error_patterns,
            'speed_analysis': speed_analysis,
            'insights': insights,
        }

    # ============ 2. TREND CALCULATION ============
    @classmethod
    def _calculate_trend(cls, sessions):
        """
        Compare recent performance vs older performance.
        Uses last 3 sessions vs the previous 3.
        """
        if len(sessions) < 2:
            return {
                'direction': 'insufficient_data',
                'change': 0,
                'recent_avg': 0,
                'older_avg': 0,
            }

        recent = sessions[-3:]
        older = sessions[:-3] if len(sessions) > 3 else sessions[:-1]

        if not older:
            return {
                'direction': 'baseline',
                'change': 0,
                'recent_avg': 0,
                'older_avg': 0,
            }

        def avg_acc(batch):
            valid = [
                (s.correct_answers / s.total_questions * 100)
                for s in batch if s.total_questions and s.total_questions > 0
            ]
            return statistics.mean(valid) if valid else 0

        recent_avg = avg_acc(recent)
        older_avg = avg_acc(older)
        change = recent_avg - older_avg

        if change > 5:
            direction = 'improving'
        elif change < -5:
            direction = 'declining'
        else:
            direction = 'stable'

        return {
            'direction': direction,
            'change': round(change, 1),
            'recent_avg': round(recent_avg, 1),
            'older_avg': round(older_avg, 1),
        }

    # ============ 3. WEAK CONTRASTS ============
    @classmethod
    def _find_weak_contrasts(cls, sound_performance):
        """Find sound contrasts where user struggles."""
        weak = []
        for sp in sound_performance:
            if sp.total_attempts and sp.total_attempts >= 3:
                acc = sp.correct_attempts / sp.total_attempts
                if acc < cls.WEAK_AREA_THRESHOLD:
                    weak.append({
                        'contrast': sp.sound_contrast,
                        'accuracy': round(acc * 100, 1),
                        'attempts': sp.total_attempts,
                        'avg_response_time': sp.avg_response_time_ms or 0,
                        'severity': 'high' if acc < 0.40 else 'medium',
                    })
        return sorted(weak, key=lambda x: x['accuracy'])

    # ============ 4. STRENGTHS ============
    @classmethod
    def _find_strengths(cls, sound_performance):
        """Find contrasts where user does well."""
        strengths = []
        for sp in sound_performance:
            if sp.total_attempts and sp.total_attempts >= 3:
                acc = sp.correct_attempts / sp.total_attempts
                if acc >= cls.STRONG_AREA_THRESHOLD:
                    strengths.append({
                        'contrast': sp.sound_contrast,
                        'accuracy': round(acc * 100, 1),
                        'attempts': sp.total_attempts,
                    })
        return sorted(strengths, key=lambda x: -x['accuracy'])

    # ============ 5. ERROR PATTERNS ============
    @classmethod
    def _detect_error_patterns(cls, sessions):
        """Detect recurring errors and patterns."""
        recent = sessions[-5:] if len(sessions) >= 5 else sessions
        patterns = []

        # Low accuracy pattern
        low_count = sum(
            1 for s in recent
            if s.total_questions and s.correct_answers / s.total_questions < 0.5
        )
        if low_count >= 3:
            patterns.append({
                'type': 'consistently_low_accuracy',
                'description': f'{low_count} of last {len(recent)} sessions below 50% accuracy',
                'severity': 'high',
            })

        # Game type struggle
        game_types = [s.game_type for s in recent if s.game_type]
        type_counts = Counter(game_types)
        for gtype, count in type_counts.items():
            if count < 2:
                continue
            type_sessions = [s for s in recent if s.game_type == gtype]
            type_acc = statistics.mean([
                s.correct_answers / s.total_questions
                for s in type_sessions if s.total_questions
            ])
            if type_acc < 0.5:
                patterns.append({
                    'type': 'game_type_struggle',
                    'description': f'Struggling with {gtype.replace("_", " ")} ({round(type_acc*100)}% avg)',
                    'game_type': gtype,
                    'severity': 'medium',
                })

        return patterns

    # ============ 6. SPEED ANALYSIS ============
    @classmethod
    def _analyze_response_time(cls, sound_performance):
        """Analyze response speed."""
        if not sound_performance:
            return {'status': 'no_data', 'avg_ms': 0, 'feedback': ''}

        rts = [
            sp.avg_response_time_ms for sp in sound_performance
            if sp.avg_response_time_ms and sp.avg_response_time_ms > 0
        ]
        if not rts:
            return {'status': 'no_data', 'avg_ms': 0, 'feedback': ''}

        avg_rt = statistics.mean(rts)

        if avg_rt < cls.RESPONSE_TIME_FAST:
            status = 'fast'
            feedback = 'You respond quickly! Focus on accuracy now.'
        elif avg_rt < cls.RESPONSE_TIME_SLOW:
            status = 'normal'
            feedback = 'Your response time is healthy.'
        else:
            status = 'slow'
            feedback = 'Try to respond a bit faster — speed matters too.'

        return {
            'status': status,
            'avg_ms': round(avg_rt),
            'feedback': feedback,
        }

    # ============ 7. INSIGHTS GENERATION ============
    @classmethod
    def _generate_insights(cls, avg_acc, trend, weak_areas, strengths, speed, total):
        """Generate human-readable insights for the dashboard."""
        insights = []

        # Accuracy insight
        if avg_acc >= 80:
            insights.append({
                'type': 'positive',
                'icon': '🏆',
                'text': f'Excellent! Your average accuracy is {avg_acc}%.',
            })
        elif avg_acc >= 60:
            insights.append({
                'type': 'neutral',
                'icon': '📊',
                'text': f'Good progress with {avg_acc}% average accuracy.',
            })
        else:
            insights.append({
                'type': 'warning',
                'icon': '⚠️',
                'text': f'Accuracy at {avg_acc}%. More practice needed.',
            })

        # Trend insight
        if trend['direction'] == 'improving':
            insights.append({
                'type': 'positive',
                'icon': '📈',
                'text': f'You are improving! Accuracy up {trend["change"]}% recently.',
            })
        elif trend['direction'] == 'declining':
            insights.append({
                'type': 'warning',
                'icon': '📉',
                'text': f'Recent accuracy dropped {abs(trend["change"])}%. Slow down.',
            })

        # Weak area insight
        if weak_areas:
            top_weak = weak_areas[0]
            insights.append({
                'type': 'action',
                'icon': '🎯',
                'text': f'Focus area: {top_weak["contrast"]} ({top_weak["accuracy"]}% accuracy).',
            })

        # Strength insight
        if strengths:
            insights.append({
                'type': 'positive',
                'icon': '💪',
                'text': f'You are strong at {strengths[0]["contrast"]} ({strengths[0]["accuracy"]}%).',
            })

        # Speed insight
        if speed.get('feedback'):
            insights.append({
                'type': 'info',
                'icon': '⚡',
                'text': speed['feedback'],
            })

        # Milestone
        if total >= 10:
            insights.append({
                'type': 'positive',
                'icon': '🎉',
                'text': f'Milestone: {total} sessions completed!',
            })

        return insights

    # ============ 8. AI RECOMMENDATION ============
    @classmethod
    def recommend_next_activity(cls, sessions, sound_performance, user_level=None):
        """
        AI recommends the next best activity based on patterns.
        """
        if not sessions:
            return {
                'game_type': 'word_discrimination',
                'difficulty': 'easy',
                'focus_area': 'general',
                'reason': 'Start with basic word discrimination to build foundation.',
                'ai_confidence': 100,
                'weak_contrasts_for_ai': [],
            }

        recent_diff = sessions[-1].difficulty_level or 'easy'

        # Weak areas
        weak_areas = cls._find_weak_contrasts(sound_performance)

        # Error patterns
        error_patterns = cls._detect_error_patterns(sessions)
        game_struggle = next(
            (p for p in error_patterns if p['type'] == 'game_type_struggle'),
            None
        )

        # Decide game type — alternate by default, or switch if struggling
        if game_struggle:
            game_type = (
                'sequence_memory' if game_struggle['game_type'] == 'word_discrimination'
                else 'word_discrimination'
            )
            game_reason = f'Switch to {game_type.replace("_", " ")} for variety and recovery.'
        else:
            last_type = sessions[-1].game_type
            game_type = (
                'sequence_memory' if last_type == 'word_discrimination'
                else 'word_discrimination'
            )
            game_reason = 'Alternating game types helps overall listening skill.'

        # Decide difficulty via AI
        difficulty, diff_reason, confidence = cls._ai_decide_difficulty(
            sessions, recent_diff
        )

        # Decide focus area
        if weak_areas:
            focus = weak_areas[0]['contrast']
            focus_reason = f'Practice {focus} ({weak_areas[0]["accuracy"]}% accuracy).'
        else:
            focus = 'general practice'
            focus_reason = 'Maintain your skills with mixed practice.'

        return {
            'game_type': game_type,
            'difficulty': difficulty,
            'focus_area': focus,
            'reason': f'{game_reason} {focus_reason} {diff_reason}',
            'ai_confidence': confidence,
            'difficulty_reasoning': diff_reason,
            'weak_contrasts_for_ai': [w['contrast'] for w in weak_areas[:3]],
        }

    # ============ 9. AI DIFFICULTY DECISION ============
    @classmethod
    def _ai_decide_difficulty(cls, sessions, current_difficulty):
        """
        AI decides difficulty via weighted scoring.
        """
        if len(sessions) < cls.MIN_ATTEMPTS:
            return (
                current_difficulty,
                f'Need {cls.MIN_ATTEMPTS - len(sessions)} more sessions for difficulty change.',
                50,
            )

        recent = sessions[-5:]

        # Weighted accuracy (newer sessions have more weight)
        weighted_sum = 0
        weight_total = 0
        for i, s in enumerate(recent):
            if s.total_questions and s.total_questions > 0:
                weight = (i + 1) / len(recent)
                weighted_sum += (s.correct_answers / s.total_questions) * weight
                weight_total += weight

        weighted_acc = (weighted_sum / weight_total) if weight_total > 0 else 0
        score = weighted_acc * 100

        # Trend bonus / penalty
        trend = cls._calculate_trend(sessions)
        if trend['direction'] == 'improving':
            score += 5
        elif trend['direction'] == 'declining':
            score -= 5

        current_idx = (
            cls.DIFFICULTY_ORDER.index(current_difficulty)
            if current_difficulty in cls.DIFFICULTY_ORDER else 0
        )

        # Upgrade
        if score >= 80 and current_idx < len(cls.DIFFICULTY_ORDER) - 1:
            new_diff = cls.DIFFICULTY_ORDER[current_idx + 1]
            return (
                new_diff,
                f'Weighted accuracy {round(weighted_acc*100)}% ≥ 80%. Level up!',
                85,
            )

        # Downgrade
        if score < 50 and current_idx > 0:
            new_diff = cls.DIFFICULTY_ORDER[current_idx - 1]
            return (
                new_diff,
                f'Weighted accuracy {round(weighted_acc*100)}% < 50%. Step back for practice.',
                80,
            )

        # Hold
        if score < 70:
            reason = f'Hold at {current_difficulty}. Score {round(score)}/100. More practice needed.'
        else:
            reason = f'Great progress at {current_difficulty}. Score {round(score)}/100.'

        return (current_difficulty, reason, 70)

    # ============ 10. AI PROGRESS SUMMARY ============
    @classmethod
    def generate_progress_summary(cls, sessions, sound_performance):
        """
        Generate a personalized progress summary for the dashboard.
        """
        if not sessions:
            return {
                'summary': 'Play your first game to see AI progress insights!',
                'highlights': [],
                'next_steps': [],
                'ai_confidence': 0,
            }

        analysis = cls.analyze_performance(sessions, sound_performance)
        recommendation = cls.recommend_next_activity(sessions, sound_performance)

        highlights = []

        if len(sessions) >= 10:
            highlights.append(f'🎉 Completed {len(sessions)} practice sessions!')
        if analysis['avg_accuracy'] >= 70:
            highlights.append(f'🏆 Accuracy above 70% — impressive!')
        if analysis['trend']['direction'] == 'improving':
            highlights.append(f'📈 Improving by {analysis["trend"]["change"]}% recently')

        next_steps = [
            f'▶️ Play {recommendation["game_type"].replace("_", " ")} at {recommendation["difficulty"]} level',
            f'🎯 Focus on: {recommendation["focus_area"]}',
        ]

        return {
            'summary': (
                f'You have played {len(sessions)} sessions with '
                f'{analysis["avg_accuracy"]}% avg accuracy. '
                f'Trend: {analysis["trend"]["direction"]}.'
            ),
            'highlights': highlights,
            'next_steps': next_steps,
            'ai_confidence': recommendation['ai_confidence'],
        }