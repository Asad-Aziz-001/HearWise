"""
Games routes — Simplified version.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.game import GameSession
from services.game_generators import (
    # Existing 6
    generate_word_in_noise,
    generate_tone_discrimination,
    generate_word_position,
    generate_rhyme_match,
    generate_word_chain,
    generate_phoneme_replacement,
    # New 5
    generate_audio_story,
    generate_pronunciation,
    generate_emotion_detection,
    generate_similar_words,
    generate_sequence_game,
    # Auto test
    auto_test_generic,
)
from datetime import datetime

games_bp = Blueprint('games', __name__)


@games_bp.route('/generate/<game_type>', methods=['POST', 'OPTIONS'])
@jwt_required()
def generate_game(game_type):
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    user_id = int(get_jwt_identity())
    data = request.json or {}
    difficulty = data.get('difficulty', 'easy')
    count = data.get('question_count', 5)
    
    generators = {
        'word_in_noise': lambda: generate_word_in_noise(user_id, difficulty, count),
        'tone_discrimination': lambda: generate_tone_discrimination(user_id, difficulty, count),
        'word_position': lambda: generate_word_position(user_id, difficulty, count),
        'rhyme_match': lambda: generate_rhyme_match(user_id, difficulty, count),
        'word_chain_memory': lambda: generate_word_chain(user_id, difficulty, count),
        'phoneme_replacement': lambda: generate_phoneme_replacement(user_id, difficulty, count),
        'audio_story': lambda: generate_audio_story(user_id, difficulty, min(3, count)),
        'pronunciation': lambda: generate_pronunciation(user_id, difficulty, count),
        'emotion_detection': lambda: generate_emotion_detection(user_id, difficulty, count),
        'similar': lambda: generate_similar_words(user_id, difficulty, count),
        'sequence': lambda: generate_sequence_game(user_id, difficulty, count),
    }
    
    if game_type not in generators:
        return jsonify({'error': f'Game "{game_type}" not yet available'}), 400
    
    try:
        game = generators[game_type]()
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
    session = GameSession(user_id=user_id, game_type=game_type, difficulty_level=difficulty)
    db.session.add(session)
    db.session.commit()
    game['session_id'] = session.id
    
    return jsonify(game)


@games_bp.route('/auto-test/<int:session_id>', methods=['POST', 'OPTIONS'])
@jwt_required()
def auto_test(session_id):
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    data = request.json or {}
    game_type = data.get('game_type', 'unknown')
    questions = data.get('questions', [])
    user_answers = data.get('user_answers', {})
    
    if not questions:
        return jsonify({'error': 'No questions'}), 400
    
    result = auto_test_generic(questions, user_answers, game_type)
    
    session = GameSession.query.get(session_id)
    if session:
        session.ended_at = datetime.utcnow()
        session.total_questions = result.get('total', 0)
        session.correct_answers = result.get('correct', 0)
        db.session.commit()
    
    return jsonify(result)