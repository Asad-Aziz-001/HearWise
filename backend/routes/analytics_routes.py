from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.game import GameSession
from models.performance import PerformanceSummary
from datetime import datetime, timedelta
from collections import defaultdict
import statistics

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/heatmap', methods=['GET'])
@jwt_required()
def heatmap():
    """Daily activity heatmap (last 60 days)."""
    user_id = int(get_jwt_identity())
    end = datetime.utcnow()
    start = end - timedelta(days=60)

    sessions = GameSession.query.filter(
        GameSession.user_id == user_id,
        GameSession.started_at >= start,
        GameSession.ended_at.isnot(None)
    ).all()

    # Group by date
    by_date = defaultdict(int)
    for s in sessions:
        date_key = s.started_at.strftime('%Y-%m-%d')
        by_date[date_key] += 1

    # Build last 60 days
    days = []
    for i in range(60):
        d = end - timedelta(days=59 - i)
        key = d.strftime('%Y-%m-%d')
        days.append({
            'date': key,
            'count': by_date.get(key, 0),
            'day_of_week': d.weekday(),
        })

    return jsonify({'days': days})


@analytics_bp.route('/comparison', methods=['GET'])
@jwt_required()
def comparison():
    """This week vs last week."""
    user_id = int(get_jwt_identity())
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

    def stats(start, end):
        sessions = GameSession.query.filter(
            GameSession.user_id == user_id,
            GameSession.started_at >= start,
            GameSession.started_at < end,
            GameSession.ended_at.isnot(None)
        ).all()
        if not sessions:
            return {'sessions': 0, 'accuracy': 0, 'questions': 0}
        total_q = sum(s.total_questions for s in sessions if s.total_questions)
        total_c = sum(s.correct_answers for s in sessions if s.total_questions)
        return {
            'sessions': len(sessions),
            'accuracy': round((total_c / total_q * 100), 1) if total_q else 0,
            'questions': total_q,
        }

    this_week = stats(week_ago, now)
    last_week = stats(two_weeks_ago, week_ago)

    return jsonify({
        'this_week': this_week,
        'last_week': last_week,
        'change': {
            'sessions': this_week['sessions'] - last_week['sessions'],
            'accuracy': round(this_week['accuracy'] - last_week['accuracy'], 1),
            'questions': this_week['questions'] - last_week['questions'],
        }
    })


@analytics_bp.route('/ai-prediction', methods=['GET'])
@jwt_required()
def ai_prediction():
    """Predict when user will reach 80% accuracy."""
    user_id = int(get_jwt_identity())

    sessions = GameSession.query.filter_by(user_id=user_id)\
        .filter(GameSession.ended_at.isnot(None))\
        .order_by(GameSession.started_at.asc()).all()

    if len(sessions) < 3:
        return jsonify({
            'prediction_available': False,
            'message': 'Need at least 3 sessions for predictions',
            'current_accuracy': 0,
        })

    # Build time series
    accuracies = []
    for s in sessions:
        if s.total_questions:
            accuracies.append((s.correct_answers / s.total_questions) * 100)

    # Simple linear regression (y = mx + b)
    n = len(accuracies)
    x_values = list(range(n))
    x_mean = sum(x_values) / n
    y_mean = sum(accuracies) / n

    numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_values, accuracies))
    denominator = sum((x - x_mean) ** 2 for x in x_values)

    if denominator == 0:
        slope = 0
    else:
        slope = numerator / denominator

    intercept = y_mean - slope * x_mean
    current_accuracy = accuracies[-1]

    # Predict sessions to reach 80%
    if slope <= 0:
        sessions_needed = -1  # declining, no prediction
    else:
        target = 80
        sessions_needed = max(1, int((target - intercept) / slope - n + 1))

    # Predict next 10 sessions
    projected = []
    for i in range(1, 11):
        future_x = n + i - 1
        predicted = max(0, min(100, intercept + slope * future_x))
        projected.append({
            'session': n + i,
            'accuracy': round(predicted, 1),
        })

    return jsonify({
        'prediction_available': True,
        'current_accuracy': round(current_accuracy, 1),
        'sessions_played': n,
        'trend': 'improving' if slope > 0.5 else 'declining' if slope < -0.5 else 'stable',
        'slope': round(slope, 2),
        'sessions_to_80': sessions_needed,
        'projected': projected,
        'history': [{'session': i + 1, 'accuracy': round(a, 1)} for i, a in enumerate(accuracies)],
    })


@analytics_bp.route('/focus-time', methods=['GET'])
@jwt_required()
def focus_time():
    """How much time spent practicing."""
    user_id = int(get_jwt_identity())

    sessions = GameSession.query.filter_by(user_id=user_id)\
        .filter(GameSession.ended_at.isnot(None)).all()

    if not sessions:
        return jsonify({'total_minutes': 0, 'avg_per_session': 0, 'by_day': []})

    total_seconds = 0
    by_day = defaultdict(int)
    for s in sessions:
        if s.started_at and s.ended_at:
            duration = (s.ended_at - s.started_at).total_seconds()
            total_seconds += duration
            date_key = s.started_at.strftime('%Y-%m-%d')
            by_day[date_key] += duration

    return jsonify({
        'total_minutes': round(total_seconds / 60, 1),
        'avg_per_session': round(total_seconds / len(sessions) / 60, 1),
        'by_day': [{'date': d, 'minutes': round(m / 60, 1)} for d, m in sorted(by_day.items())[-14:]],
    })