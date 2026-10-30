from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.game import GameSession, Attempt
from models.performance import PerformanceSummary, Recommendation
from services.adaptive_engine import AdaptiveEngine
from services.ai_engine import AIEngine
from datetime import datetime, timedelta
from collections import defaultdict

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/progress', methods=['GET'])
@jwt_required()
def progress():
    try:
        user_id = int(get_jwt_identity())
    except Exception as e:
        return jsonify({'error': str(e)}), 401

    # Get all finished sessions
    sessions = GameSession.query.filter(
        GameSession.user_id == user_id,
        GameSession.ended_at.isnot(None)
    ).order_by(GameSession.started_at.asc()).all()

    # Build history
    history = []
    for s in sessions:
        if not s.total_questions or s.total_questions == 0:
            continue
        accuracy = round((s.correct_answers / s.total_questions) * 100, 1)
        history.append({
            'date': s.started_at.strftime('%Y-%m-%d'),
            'accuracy': float(accuracy),
            'difficulty': s.difficulty_level,
            'game_type': s.game_type,
            'total_questions': s.total_questions,
            'correct_answers': s.correct_answers,
            'duration_seconds': int((s.ended_at - s.started_at).total_seconds()) if s.started_at and s.ended_at else 0,
        })

    # ✅ NEW: Per-game breakdown
    game_types = [
        'similar', 'sequence', 'tone_discrimination', 'rhyme_match',
        'word_position', 'word_chain_memory', 'phoneme_replacement',
        'audio_story', 'pronunciation', 'emotion_detection', 'word_in_noise',
        # Legacy names
        'word_discrimination', 'sequence_memory'
    ]
    
    per_game = {}
    for gt in game_types:
        game_sessions = [s for s in sessions if s.game_type == gt]
        if not game_sessions:
            continue
        
        total_q = sum(s.total_questions or 0 for s in game_sessions)
        total_c = sum(s.correct_answers or 0 for s in game_sessions)
        acc = (total_c / total_q * 100) if total_q else 0
        
        per_game[gt] = {
            'sessions': len(game_sessions),
            'total_questions': total_q,
            'correct_answers': total_c,
            'accuracy': round(acc, 1),
        }
    
    # Weak areas
    perf = PerformanceSummary.query.filter_by(user_id=user_id).all()
    weak = AdaptiveEngine.find_weak_contrasts(perf)
    
    # AI summary
    try:
        ai_summary = AIEngine.generate_progress_summary(sessions, perf)
    except:
        ai_summary = None
    
    return jsonify({
        'history': history,
        'per_game': per_game,   # ✅ NEW
        'weak_areas': weak,
        'sound_performance': [{
            'contrast': p.sound_contrast,
            'accuracy': round((p.correct_attempts / p.total_attempts) * 100, 1)
                        if p.total_attempts else 0,
            'avg_response_time': p.avg_response_time_ms,
            'attempts': p.total_attempts
        } for p in perf],
        'ai_summary': ai_summary,
    })


@dashboard_bp.route('/recommendation', methods=['GET'])
@jwt_required()
def latest_recommendation():
    try:
        user_id = int(get_jwt_identity())
    except Exception as e:
        return jsonify({'error': str(e)}), 401

    rec = Recommendation.query.filter_by(user_id=user_id)\
        .order_by(Recommendation.created_at.desc()).first()

    if not rec:
        return jsonify({'message': 'No recommendations yet'})

    return jsonify({
        'game_type': rec.recommended_game_type,
        'difficulty': rec.recommended_difficulty,
        'focus_area': rec.focus_area,
        'reason': rec.reason
    })