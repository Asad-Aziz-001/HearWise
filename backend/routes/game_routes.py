from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.game import GameSession, Attempt
from models.word_pair import WordPair
from models.performance import PerformanceSummary, Recommendation
from services.adaptive_engine import AdaptiveEngine
from datetime import datetime
import random

game_bp = Blueprint('game', __name__)

@game_bp.route('/start', methods=['POST'])
@jwt_required()
def start_game():
    user_id = get_jwt_identity()
    data = request.json
    game_type = data.get('game_type', 'word_discrimination')
    difficulty = data.get('difficulty', 'easy')

    session = GameSession(user_id=user_id, game_type=game_type,
                          difficulty_level=difficulty)
    db.session.add(session)
    db.session.commit()

    # Fetch questions matching difficulty
    pairs = WordPair.query.filter_by(difficulty=difficulty, status='approved').all()
    if len(pairs) < 5:
        pairs = WordPair.query.filter_by(status='approved').all()
    random.shuffle(pairs)

    questions = [{
        'question_id': i + 1,
        'word_pair_id': p.id,
        'option_a': p.word1,
        'option_b': p.word2,
        'audio_a': p.audio1_path,
        'audio_b': p.audio2_path,
        'correct': random.choice(['a', 'b']),
        'sound_contrast': p.sound_contrast
    } for i, p in enumerate(pairs[:10])]

    session.total_questions = len(questions)
    db.session.commit()

    return jsonify({'session_id': session.id, 'questions': questions})

@game_bp.route('/submit/<int:session_id>', methods=['POST'])
@jwt_required()
def submit_answer(session_id):
    try:
        user_id = int(get_jwt_identity())
        data = request.json

        # Create attempt
        attempt = Attempt(
            session_id=session_id,
            question_id=data['question_id'],
            word_pair_id=data['word_pair_id'],
            user_answer=data['answer'],
            is_correct=data['answer'] == data['correct'],
            response_time_ms=data['response_time_ms']
        )
        db.session.add(attempt)

        # Update performance summary
        pair = WordPair.query.get(data['word_pair_id'])
        if pair:
            perf = PerformanceSummary.query.filter_by(
                user_id=user_id, sound_contrast=pair.sound_contrast
            ).first()

            if not perf:
                perf = PerformanceSummary(
                    user_id=user_id,
                    sound_contrast=pair.sound_contrast,
                    total_attempts=0,
                    correct_attempts=0,
                    avg_response_time_ms=0
                )
                db.session.add(perf)
                db.session.flush()   # get ID

            # ✅ Safe increment — handle None values
            perf.total_attempts = (perf.total_attempts or 0) + 1
            if data['answer'] == data['correct']:
                perf.correct_attempts = (perf.correct_attempts or 0) + 1

            # Rolling average — safe
            old_avg = perf.avg_response_time_ms or 0
            old_count = perf.total_attempts - 1  # after increment
            new_avg = ((old_avg * old_count) + data['response_time_ms']) / perf.total_attempts
            perf.avg_response_time_ms = int(new_avg)

        db.session.commit()

        return jsonify({
            'correct': data['answer'] == data['correct'],
            'message': 'Answer submitted'
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@game_bp.route('/end/<int:session_id>', methods=['POST'])
@jwt_required()
def end_game(session_id):
    from services.ai_engine import AIEngine  # import on top
    
    user_id = int(get_jwt_identity())
    session = GameSession.query.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    session.ended_at = datetime.utcnow()
    
    attempts = Attempt.query.filter_by(session_id=session_id).all()
    session.correct_answers = sum(1 for a in attempts if a.is_correct)
    db.session.commit()
    
    # ✅ AI decides next difficulty
    all_sessions = GameSession.query.filter_by(user_id=user_id)\
        .filter(GameSession.ended_at.isnot(None))\
        .order_by(GameSession.started_at.asc()).all()
    perf = PerformanceSummary.query.filter_by(user_id=user_id).all()
    
    rec = AIEngine.recommend_next_activity(all_sessions, perf)
    
    accuracy = (session.correct_answers / session.total_questions * 100
                if session.total_questions else 0)
    
    return jsonify({
        'session': session.to_dict(),
        'accuracy': round(accuracy, 1),
        'next_difficulty': rec['difficulty'],
        'ai_analysis': {
            'reason': rec['reason'],
            'confidence': rec['ai_confidence'],
            'focus_area': rec['focus_area'],
            'game_type': rec['game_type'],
        },
    })
