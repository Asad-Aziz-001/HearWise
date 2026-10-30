from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.game import GameSession, Attempt
from models.performance import PerformanceSummary
from services.ai_game_generator import AIGameGenerator
from datetime import datetime

ai_bp = Blueprint('ai', __name__)


@ai_bp.route('/generate-game', methods=['POST', 'OPTIONS'])
@jwt_required()
def generate_game():
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200

    user_id = int(get_jwt_identity())
    data = request.json or {}

    # If user didn't specify, AI decides
    difficulty = data.get('difficulty')
    focus_area = data.get('focus_area')
    question_count = data.get('question_count', 5)

    # Get user's full data
    sessions = GameSession.query.filter_by(user_id=user_id)\
        .filter(GameSession.ended_at.isnot(None))\
        .order_by(GameSession.started_at.asc()).all()
    perf = PerformanceSummary.query.filter_by(user_id=user_id).all()

    # ✅ AI DECIDES if not specified
    from services.ai_engine import AIEngine
    ai_rec = AIEngine.recommend_next_activity(sessions, perf)

    if not difficulty:
        difficulty = ai_rec['difficulty']
    if not focus_area:
        focus_area = ai_rec['focus_area']

    weak = ai_rec.get('weak_contrasts_for_ai', [])

    # AI generates game
    game = AIGameGenerator.generate_game(
        user_id=user_id,
        weak_contrasts=weak,
        difficulty=difficulty,
        focus_area=focus_area,
        question_count=question_count,
    )

    # Session
    session = GameSession(
        user_id=user_id,
        game_type='ai_generated',
        difficulty_level=difficulty,
    )
    db.session.add(session)
    db.session.commit()
    game['session_id'] = session.id
    game['ai_decision'] = ai_rec

    return jsonify(game)


@ai_bp.route('/auto-test/<int:session_id>', methods=['POST', 'OPTIONS'])
@jwt_required()
def auto_test(session_id):
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200

    user_id = int(get_jwt_identity())
    data = request.json or {}
    questions = data.get('questions', [])
    user_answers = data.get('user_answers', {})

    if not questions:
        return jsonify({'error': 'No questions provided'}), 400

    test_result = AIGameGenerator.auto_test(questions, user_answers)


    session = GameSession.query.get(session_id)
    if session:
        session.ended_at = datetime.utcnow()
        session.total_questions = len(questions)
        session.correct_answers = test_result['correct']

        for r in test_result['results']:
            att = Attempt(
                session_id=session.id,
                question_id=r['question_id'],
                user_answer=r['user_answer'] or 'skipped',
                is_correct=r['is_correct'],
                response_time_ms=0,
            )
            db.session.add(att)

            contrast = r['sound_contrast']
            p = PerformanceSummary.query.filter_by(
                user_id=user_id, sound_contrast=contrast
            ).first()
            if not p:
                p = PerformanceSummary(user_id=user_id, sound_contrast=contrast)
                db.session.add(p)
            p.total_attempts = (p.total_attempts or 0) + 1
            if r['is_correct']:
                p.correct_attempts = (p.correct_attempts or 0) + 1

        db.session.commit()

    return jsonify(test_result)


@ai_bp.route('/generate-similar-game', methods=['POST', 'OPTIONS'])
@jwt_required()
def generate_similar_game():
    """AI generates Similar-Sounding Words game."""
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    user_id = int(get_jwt_identity())
    data = request.json or {}
    
    difficulty = data.get('difficulty', 'easy')
    focus_area = data.get('focus_area')
    question_count = data.get('question_count', 10)
    
    # Get user's weak areas
    perf = PerformanceSummary.query.filter_by(user_id=user_id).all()
    weak_contrasts = [
        p.sound_contrast for p in perf
        if p.total_attempts and p.total_attempts >= 3
        and (p.correct_attempts / p.total_attempts) < 0.6
    ]
    
    game = AIGameGenerator.generate_game(
        user_id=user_id,
        weak_contrasts=weak_contrasts,
        difficulty=difficulty,
        focus_area=focus_area,
        question_count=question_count,
    )
    
    session = GameSession(
        user_id=user_id,
        game_type='word_discrimination',
        difficulty_level=difficulty,
    )
    db.session.add(session)
    db.session.commit()
    game['session_id'] = session.id
    
    return jsonify(game)


@ai_bp.route('/generate-sequence-game', methods=['POST', 'OPTIONS'])
@jwt_required()
def generate_sequence_game():
    """AI generates Auditory Sequence Memory game."""
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    user_id = int(get_jwt_identity())
    data = request.json or {}
    
    difficulty = data.get('difficulty', 'easy')
    sequence_length = data.get('sequence_length', 3)
    question_count = data.get('question_count', 5)
    
    game = AIGameGenerator.generate_sequence_game(
        user_id=user_id,
        difficulty=difficulty,
        sequence_length=sequence_length,
        question_count=question_count,
    )
    
    session = GameSession(
        user_id=user_id,
        game_type='sequence_memory',
        difficulty_level=difficulty,
    )
    db.session.add(session)
    db.session.commit()
    game['session_id'] = session.id
    
    return jsonify(game)


@ai_bp.route('/auto-test-sequence/<int:session_id>', methods=['POST', 'OPTIONS'])
@jwt_required()
def auto_test_sequence(session_id):
    """AI tests sequence game."""
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    user_id = int(get_jwt_identity())
    data = request.json or {}
    questions = data.get('questions', [])
    user_answers = data.get('user_answers', {})
    
    if not questions:
        return jsonify({'error': 'No questions'}), 400
    
    test_result = AIGameGenerator.auto_test_sequence(questions, user_answers)
    
    # Save to DB
    session = GameSession.query.get(session_id)
    if session:
        session.ended_at = datetime.utcnow()
        session.total_questions = len(questions)
        session.correct_answers = test_result['correct']
        db.session.commit()
    
    return jsonify(test_result)

#---------------------
@ai_bp.route('/stats', methods=['GET', 'OPTIONS'])
@jwt_required()
def ai_stats():
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200

    user_id = int(get_jwt_identity())

    ai_sessions = GameSession.query.filter_by(
        user_id=user_id, game_type='ai_generated'
    ).filter(GameSession.ended_at.isnot(None)).all()

    total_ai_sessions = len(ai_sessions)
    total_ai_attempts = sum(s.total_questions or 0 for s in ai_sessions) if ai_sessions else 0
    correct_ai = sum(s.correct_answers or 0 for s in ai_sessions) if ai_sessions else 0
    avg_acc = (correct_ai / total_ai_attempts * 100) if total_ai_attempts else 0

    return jsonify({
        'total_ai_sessions': total_ai_sessions,
        'total_ai_attempts': total_ai_attempts,
        'avg_accuracy': round(avg_acc, 1),
    })