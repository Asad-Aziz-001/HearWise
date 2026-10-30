"""
Admin Routes — Complete admin API
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.user import User
from models.game import GameSession, Attempt
from models.word_pair import WordPair
from models.performance import PerformanceSummary
from datetime import datetime, timedelta
from sqlalchemy import func

admin_bp = Blueprint('admin', __name__)


# ============================================================
# HELPER: Admin check
# ============================================================
def require_admin():
    """Check if current user is admin."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != 'admin':
        return None
    return user


# ============================================================
# ADMIN DASHBOARD — Overview stats
# ============================================================
@admin_bp.route('/dashboard', methods=['GET', 'OPTIONS'])
@jwt_required()
def admin_dashboard():
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    # Total users
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    admin_users = User.query.filter_by(role='admin').count()
    
    # Total sessions
    total_sessions = GameSession.query.filter(
        GameSession.ended_at.isnot(None)
    ).count()
    
    # Total questions answered
    total_attempts = Attempt.query.count()
    correct_attempts = Attempt.query.filter_by(is_correct=True).count()
    overall_accuracy = round(
        (correct_attempts / total_attempts * 100) if total_attempts else 0, 1
    )
    
    # Game type breakdown
    game_stats = db.session.query(
        GameSession.game_type,
        func.count(GameSession.id).label('count')
    ).filter(
        GameSession.ended_at.isnot(None)
    ).group_by(GameSession.game_type).all()
    
    game_breakdown = [
        {'game_type': g[0], 'sessions': g[1]} for g in game_stats
    ]
    
    # Recent signups (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_users = User.query.filter(
        User.created_at >= week_ago
    ).count()
    
    # Recent sessions (last 7 days)
    recent_sessions = GameSession.query.filter(
        GameSession.started_at >= week_ago,
        GameSession.ended_at.isnot(None)
    ).count()
    
    return jsonify({
        'users': {
            'total': total_users,
            'active': active_users,
            'admins': admin_users,
            'recent_7d': recent_users,
        },
        'sessions': {
            'total': total_sessions,
            'recent_7d': recent_sessions,
        },
        'attempts': {
            'total': total_attempts,
            'correct': correct_attempts,
            'accuracy': overall_accuracy,
        },
        'game_breakdown': game_breakdown,
    })


# ============================================================
# USERS — List all users
# ============================================================
@admin_bp.route('/users', methods=['GET', 'OPTIONS'])
@jwt_required()
def list_users():
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    users = User.query.order_by(User.created_at.desc()).all()
    
    result = []
    for u in users:
        # Count sessions per user
        session_count = GameSession.query.filter_by(user_id=u.id)\
            .filter(GameSession.ended_at.isnot(None)).count()
        
        result.append({
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'role': u.role,
            'is_active': u.is_active,
            'created_at': u.created_at.strftime('%Y-%m-%d %H:%M'),
            'sessions': session_count,
        })
    
    return jsonify({'users': result, 'total': len(result)})


# ============================================================
# USER — Update (toggle active / role)
# ============================================================
@admin_bp.route('/users/<int:user_id>', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_user(user_id):
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Don't allow admin to demote themselves
    if user.id == admin.id and request.json.get('role') == 'user':
        return jsonify({'error': 'Cannot demote yourself'}), 400
    
    data = request.json or {}
    
    if 'is_active' in data:
        user.is_active = bool(data['is_active'])
    
    if 'role' in data and data['role'] in ['user', 'admin']:
        user.role = data['role']
    
    db.session.commit()
    
    return jsonify({
        'message': 'User updated',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active,
        }
    })


# ============================================================
# USER — Delete
# ============================================================
@admin_bp.route('/users/<int:user_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_user(user_id):
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    if user_id == admin.id:
        return jsonify({'error': 'Cannot delete yourself'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Delete related data
    GameSession.query.filter_by(user_id=user_id).delete()
    PerformanceSummary.query.filter_by(user_id=user_id).delete()
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': f'User {user.username} deleted'})


# ============================================================
# CONTENT — Word pairs (legacy, for admin management)
# ============================================================
@admin_bp.route('/content', methods=['GET', 'OPTIONS'])
@jwt_required()
def list_content():
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    pairs = WordPair.query.order_by(WordPair.created_at.desc()).all()
    
    return jsonify({
        'pairs': [p.to_dict() for p in pairs],
        'total': len(pairs),
    })


@admin_bp.route('/content', methods=['POST', 'OPTIONS'])
@jwt_required()
def add_content():
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    data = request.json or {}
    
    required = ['pair_code', 'word1', 'word2', 'category', 'difficulty']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'Missing field: {field}'}), 400
    
    # Check duplicate
    if WordPair.query.filter_by(pair_code=data['pair_code']).first():
        return jsonify({'error': 'Pair code already exists'}), 400
    
    pair = WordPair(
        pair_code=data['pair_code'],
        word1=data['word1'],
        word2=data['word2'],
        sound_contrast=data.get('sound_contrast', ''),
        category=data['category'],
        difficulty=data['difficulty'],
        audio1_path=data.get('audio1_path', ''),
        audio2_path=data.get('audio2_path', ''),
        status='approved',
    )
    db.session.add(pair)
    db.session.commit()
    
    return jsonify({'message': 'Pair added', 'pair': pair.to_dict()}), 201


@admin_bp.route('/content/<int:pair_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_content(pair_id):
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    pair = WordPair.query.get(pair_id)
    if not pair:
        return jsonify({'error': 'Pair not found'}), 404
    
    db.session.delete(pair)
    db.session.commit()
    
    return jsonify({'message': 'Pair deleted'})


from models.content import (
    ContentWordPair, ContentSentence, ContentEmotion,
    ContentPhoneme, ContentRhymePair, ContentWordChain
)


# ============================================================
# CONTENT — Master Control Room
# ============================================================

@admin_bp.route('/content/<content_type>', methods=['GET', 'OPTIONS'])
@jwt_required()
def list_content_by_type(content_type):
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    models = {
        'word_pairs': ContentWordPair,
        'sentences': ContentSentence,
        'emotions': ContentEmotion,
        'phonemes': ContentPhoneme,
        'rhyme_pairs': ContentRhymePair,
        'word_chains': ContentWordChain,
    }
    
    if content_type not in models:
        return jsonify({'error': 'Invalid content type'}), 400
    
    items = models[content_type].query.order_by(
        models[content_type].created_at.desc()
    ).all()
    
    return jsonify({
        'items': [i.to_dict() for i in items],
        'total': len(items),
        'type': content_type,
    })


@admin_bp.route('/content/<content_type>', methods=['POST', 'OPTIONS'])
@jwt_required()
def add_content_by_type(content_type):
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    data = request.json or {}
    models = {
        'word_pairs': ContentWordPair,
        'sentences': ContentSentence,
        'emotions': ContentEmotion,
        'phonemes': ContentPhoneme,
        'rhyme_pairs': ContentRhymePair,
        'word_chains': ContentWordChain,
    }
    
    if content_type not in models:
        return jsonify({'error': 'Invalid content type'}), 400
    
    Model = models[content_type]
    
    try:
        # Create instance based on type
        if content_type == 'word_pairs':
            item = Model(
                word1=data['word1'],
                word2=data['word2'],
                sound_contrast=data.get('sound_contrast', ''),
                category=data.get('category', 'consonant'),
                difficulty=data.get('difficulty', 'easy'),
                is_active=data.get('is_active', True),
            )
        elif content_type == 'sentences':
            item = Model(
                text=data['text'],
                category=data.get('category', 'story'),
                difficulty=data.get('difficulty', 'easy'),
                is_active=data.get('is_active', True),
            )
        elif content_type == 'emotions':
            item = Model(
                text=data['text'],
                emotion=data['emotion'],
                is_active=data.get('is_active', True),
            )
        elif content_type == 'phonemes':
            item = Model(
                original_word=data['original_word'],
                new_word=data['new_word'],
                sound_change=data.get('sound_change', ''),
                difficulty=data.get('difficulty', 'easy'),
                is_active=data.get('is_active', True),
            )
        elif content_type == 'rhyme_pairs':
            item = Model(
                word1=data['word1'],
                word2=data['word2'],
                is_active=data.get('is_active', True),
            )
        elif content_type == 'word_chains':
            item = Model(
                words=data['words'],
                difficulty=data.get('difficulty', 'easy'),
                is_active=data.get('is_active', True),
            )
        
        db.session.add(item)
        db.session.commit()
        
        return jsonify({'message': 'Added', 'item': item.to_dict()}), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@admin_bp.route('/content/<content_type>/<int:item_id>', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_content_by_type(content_type, item_id):
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    models = {
        'word_pairs': ContentWordPair,
        'sentences': ContentSentence,
        'emotions': ContentEmotion,
        'phonemes': ContentPhoneme,
        'rhyme_pairs': ContentRhymePair,
        'word_chains': ContentWordChain,
    }
    
    if content_type not in models:
        return jsonify({'error': 'Invalid type'}), 400
    
    item = models[content_type].query.get(item_id)
    if not item:
        return jsonify({'error': 'Not found'}), 404
    
    data = request.json or {}
    for key, value in data.items():
        if hasattr(item, key):
            setattr(item, key, value)
    
    db.session.commit()
    
    return jsonify({'message': 'Updated', 'item': item.to_dict()})


@admin_bp.route('/content/<content_type>/<int:item_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_content_by_type(content_type, item_id):
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    models = {
        'word_pairs': ContentWordPair,
        'sentences': ContentSentence,
        'emotions': ContentEmotion,
        'phonemes': ContentPhoneme,
        'rhyme_pairs': ContentRhymePair,
        'word_chains': ContentWordChain,
    }
    
    if content_type not in models:
        return jsonify({'error': 'Invalid type'}), 400
    
    item = models[content_type].query.get(item_id)
    if not item:
        return jsonify({'error': 'Not found'}), 404
    
    db.session.delete(item)
    db.session.commit()
    
    return jsonify({'message': 'Deleted'})


@admin_bp.route('/content-all-stats', methods=['GET', 'OPTIONS'])
@jwt_required()
def content_all_stats():
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    return jsonify({
        'word_pairs': {
            'total': ContentWordPair.query.count(),
            'active': ContentWordPair.query.filter_by(is_active=True).count(),
        },
        'sentences': {
            'total': ContentSentence.query.count(),
            'active': ContentSentence.query.filter_by(is_active=True).count(),
        },
        'emotions': {
            'total': ContentEmotion.query.count(),
            'active': ContentEmotion.query.filter_by(is_active=True).count(),
        },
        'phonemes': {
            'total': ContentPhoneme.query.count(),
            'active': ContentPhoneme.query.filter_by(is_active=True).count(),
        },
        'rhyme_pairs': {
            'total': ContentRhymePair.query.count(),
            'active': ContentRhymePair.query.filter_by(is_active=True).count(),
        },
        'word_chains': {
            'total': ContentWordChain.query.count(),
            'active': ContentWordChain.query.filter_by(is_active=True).count(),
        },
    })


# ============================================================
# RECENT ACTIVITY — Recent sessions
# ============================================================
@admin_bp.route('/activity', methods=['GET', 'OPTIONS'])
@jwt_required()
def recent_activity():
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    # Get last 20 sessions with user info
    sessions = db.session.query(
        GameSession, User
    ).join(
        User, GameSession.user_id == User.id
    ).filter(
        GameSession.ended_at.isnot(None)
    ).order_by(
        GameSession.started_at.desc()
    ).limit(20).all()
    
    result = []
    for session, user in sessions:
        accuracy = round(
            (session.correct_answers / session.total_questions * 100)
            if session.total_questions else 0, 1
        )
        result.append({
            'id': session.id,
            'user': user.username,
            'email': user.email,
            'game_type': session.game_type,
            'difficulty': session.difficulty_level,
            'accuracy': accuracy,
            'total_questions': session.total_questions,
            'correct_answers': session.correct_answers,
            'date': session.started_at.strftime('%Y-%m-%d %H:%M'),
        })
    
    return jsonify({'activity': result, 'total': len(result)})


# ============================================================
# USER DETAIL — Full activity for one user
# ============================================================
@admin_bp.route('/users/<int:user_id>/detail', methods=['GET', 'OPTIONS'])
@jwt_required()
def user_detail(user_id):
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get user's sessions
    sessions = GameSession.query.filter_by(user_id=user_id)\
        .filter(GameSession.ended_at.isnot(None))\
        .order_by(GameSession.started_at.desc())\
        .all()
    
    # Calculate stats
    total_q = sum(s.total_questions or 0 for s in sessions)
    total_c = sum(s.correct_answers or 0 for s in sessions)
    avg_accuracy = round((total_c / total_q * 100) if total_q else 0, 1)
    
    # Game type breakdown
    game_breakdown = {}
    for s in sessions:
        gt = s.game_type
        if gt not in game_breakdown:
            game_breakdown[gt] = {'sessions': 0, 'total_q': 0, 'total_c': 0}
        game_breakdown[gt]['sessions'] += 1
        game_breakdown[gt]['total_q'] += s.total_questions or 0
        game_breakdown[gt]['total_c'] += s.correct_answers or 0
    
    # Per-game accuracy
    game_stats = []
    for gt, data in game_breakdown.items():
        game_stats.append({
            'game_type': gt,
            'sessions': data['sessions'],
            'accuracy': round((data['total_c'] / data['total_q'] * 100) if data['total_q'] else 0, 1),
        })
    
    # Recent sessions (last 10)
    recent = []
    for s in sessions[:10]:
        accuracy = round(
            (s.correct_answers / s.total_questions * 100)
            if s.total_questions else 0, 1
        )
        recent.append({
            'id': s.id,
            'game_type': s.game_type,
            'difficulty': s.difficulty_level,
            'accuracy': accuracy,
            'total_questions': s.total_questions,
            'correct_answers': s.correct_answers,
            'date': s.started_at.strftime('%Y-%m-%d %H:%M'),
        })
    
    # Weak contrasts
    perf = PerformanceSummary.query.filter_by(user_id=user_id)\
        .filter(PerformanceSummary.total_attempts >= 3)\
        .all()
    
    weak = []
    for p in perf:
        acc = round((p.correct_attempts / p.total_attempts * 100) if p.total_attempts else 0, 1)
        if acc < 60:
            weak.append({
                'contrast': p.sound_contrast,
                'accuracy': acc,
                'attempts': p.total_attempts,
            })
    
    return jsonify({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active,
            'created_at': user.created_at.strftime('%Y-%m-%d %H:%M'),
        },
        'stats': {
            'total_sessions': len(sessions),
            'total_questions': total_q,
            'correct_answers': total_c,
            'avg_accuracy': avg_accuracy,
        },
        'game_stats': sorted(game_stats, key=lambda x: -x['sessions']),
        'recent_sessions': recent,
        'weak_areas': sorted(weak, key=lambda x: x['accuracy'])[:5],
    })


# ============================================================
# USERS ACTIVITY — All users with activity summary
# ============================================================
@admin_bp.route('/users-activity', methods=['GET', 'OPTIONS'])
@jwt_required()
def users_activity():
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    users = User.query.filter_by(role='user').order_by(User.created_at.desc()).all()
    
    result = []
    for u in users:
        sessions = GameSession.query.filter_by(user_id=u.id)\
            .filter(GameSession.ended_at.isnot(None))\
            .order_by(GameSession.started_at.desc())\
            .all()
        
        total_q = sum(s.total_questions or 0 for s in sessions)
        total_c = sum(s.correct_answers or 0 for s in sessions)
        accuracy = round((total_c / total_q * 100) if total_q else 0, 1)
        
        # Last active
        last_active = sessions[0].started_at.strftime('%Y-%m-%d %H:%M') if sessions else 'Never'
        
        # Favorite game
        game_counts = {}
        for s in sessions:
            game_counts[s.game_type] = game_counts.get(s.game_type, 0) + 1
        favorite = max(game_counts.items(), key=lambda x: x[1])[0] if game_counts else None
        
        result.append({
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'is_active': u.is_active,
            'created_at': u.created_at.strftime('%Y-%m-%d'),
            'sessions': len(sessions),
            'accuracy': accuracy,
            'total_questions': total_q,
            'last_active': last_active,
            'favorite_game': favorite,
        })
    
    return jsonify({'users': result, 'total': len(result)})


# ============================================================
# DAILY ACTIVITY — Heatmap data (last 30 days)
# ============================================================
@admin_bp.route('/daily-activity', methods=['GET', 'OPTIONS'])
@jwt_required()
def daily_activity():
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    from datetime import timedelta
    
    end = datetime.utcnow()
    start = end - timedelta(days=30)
    
    sessions = GameSession.query.filter(
        GameSession.started_at >= start,
        GameSession.ended_at.isnot(None)
    ).all()
    
    by_date = {}
    for s in sessions:
        date_key = s.started_at.strftime('%Y-%m-%d')
        by_date[date_key] = by_date.get(date_key, 0) + 1
    
    days = []
    for i in range(30):
        d = end - timedelta(days=29 - i)
        key = d.strftime('%Y-%m-%d')
        days.append({
            'date': key,
            'sessions': by_date.get(key, 0),
            'day_of_week': d.weekday(),
        })
    
    return jsonify({'days': days})


# ============================================================
# LIVE ACTIVITY — Enhanced realtime feed
# ============================================================
@admin_bp.route('/live-activity', methods=['GET', 'OPTIONS'])
@jwt_required()
def live_activity():
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    from datetime import timedelta
    
    now = datetime.utcnow()
    
    # Recent sessions (last 50)
    sessions = db.session.query(
        GameSession, User
    ).join(
        User, GameSession.user_id == User.id
    ).filter(
        GameSession.ended_at.isnot(None)
    ).order_by(
        GameSession.started_at.desc()
    ).limit(50).all()
    
    feed = []
    for session, user in sessions:
        accuracy = round(
            (session.correct_answers / session.total_questions * 100)
            if session.total_questions else 0, 1
        )
        duration = int((session.ended_at - session.started_at).total_seconds()) if session.ended_at else 0
        feed.append({
            'id': session.id,
            'user_id': user.id,
            'user': user.username,
            'user_initial': user.username[0].upper() if user.username else '?',
            'game_type': session.game_type,
            'difficulty': session.difficulty_level,
            'accuracy': accuracy,
            'total_questions': session.total_questions,
            'correct_answers': session.correct_answers,
            'duration': duration,
            'timestamp': session.started_at.isoformat(),
            'date': session.started_at.strftime('%Y-%m-%d %H:%M:%S'),
        })
    
    # Today's stats
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_sessions = GameSession.query.filter(
        GameSession.started_at >= today_start,
        GameSession.ended_at.isnot(None)
    ).all()
    
    # This hour
    hour_start = now.replace(minute=0, second=0, microsecond=0)
    hour_sessions = [s for s in today_sessions if s.started_at >= hour_start]
    
    # This minute (last 60 sec)
    minute_start = now - timedelta(minutes=1)
    minute_sessions = GameSession.query.filter(
        GameSession.started_at >= minute_start,
        GameSession.ended_at.isnot(None)
    ).count()
    
    # Top active users today
    user_counts = {}
    for s in today_sessions:
        user_counts[s.user_id] = user_counts.get(s.user_id, 0) + 1
    
    top_users_data = []
    for user_id, count in sorted(user_counts.items(), key=lambda x: -x[1])[:5]:
        u = User.query.get(user_id)
        if u:
            top_users_data.append({
                'username': u.username,
                'initial': u.username[0].upper() if u.username else '?',
                'sessions': count,
            })
    
    # Hourly activity (last 24 hours)
    hourly = []
    for i in range(23, -1, -1):
        hour_time = now - timedelta(hours=i)
        hour_key = hour_time.strftime('%H:00')
        hour_start_this = hour_time.replace(minute=0, second=0, microsecond=0)
        hour_end = hour_start_this + timedelta(hours=1)
        
        count = GameSession.query.filter(
            GameSession.started_at >= hour_start_this,
            GameSession.started_at < hour_end,
            GameSession.ended_at.isnot(None)
        ).count()
        
        hourly.append({
            'hour': hour_key,
            'sessions': count,
        })
    
    return jsonify({
        'feed': feed,
        'stats': {
            'today': len(today_sessions),
            'this_hour': len(hour_sessions),
            'this_minute': minute_sessions,
        },
        'top_users': top_users_data,
        'hourly': hourly,
    })    


# ============================================================
# CONTENT — Enhanced word pair management
# ============================================================
@admin_bp.route('/content-stats', methods=['GET', 'OPTIONS'])
@jwt_required()
def content_stats():
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    total = WordPair.query.count()
    
    # By category
    by_category = {}
    for cat in ['vowel', 'consonant']:
        by_category[cat] = WordPair.query.filter_by(category=cat).count()
    
    # By difficulty
    by_difficulty = {}
    for diff in ['easy', 'medium', 'hard']:
        by_difficulty[diff] = WordPair.query.filter_by(difficulty=diff).count()
    
    # By status
    approved = WordPair.query.filter_by(status='approved').count()
    pending = WordPair.query.filter_by(status='pending').count()
    
    # Check audio files
    import os
    audio_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'static', 'audio'
    )
    
    pairs_with_audio = 0
    pairs_missing_audio = 0
    
    for p in WordPair.query.all():
        a1_exists = p.audio1_path and os.path.exists(os.path.join(audio_dir, p.audio1_path))
        a2_exists = p.audio2_path and os.path.exists(os.path.join(audio_dir, p.audio2_path))
        
        if a1_exists and a2_exists:
            pairs_with_audio += 1
        else:
            pairs_missing_audio += 1
    
    # Count total audio files
    total_audio = 0
    ai_audio = 0
    tone_audio = 0
    
    if os.path.exists(audio_dir):
        for f in os.listdir(audio_dir):
            if f.endswith('.mp3') or f.endswith('.wav'):
                total_audio += 1
                if f.startswith('ai_'):
                    ai_audio += 1
                elif f.startswith('tone_'):
                    tone_audio += 1
    
    return jsonify({
        'total_pairs': total,
        'by_category': by_category,
        'by_difficulty': by_difficulty,
        'status': {
            'approved': approved,
            'pending': pending,
        },
        'audio': {
            'with_audio': pairs_with_audio,
            'missing_audio': pairs_missing_audio,
            'total_files': total_audio,
            'ai_generated': ai_audio,
            'tones': tone_audio,
        }
    })


@admin_bp.route('/content/<int:pair_id>', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_content(pair_id):
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    pair = WordPair.query.get(pair_id)
    if not pair:
        return jsonify({'error': 'Pair not found'}), 404
    
    data = request.json or {}
    
    for field in ['word1', 'word2', 'sound_contrast', 'category',
                  'difficulty', 'audio1_path', 'audio2_path', 'status']:
        if field in data:
            setattr(pair, field, data[field])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Pair updated',
        'pair': pair.to_dict(),
    })


# ============================================================
# DASHBOARD — All users with metrics (for charts)
# ============================================================
@admin_bp.route('/dashboard-users', methods=['GET', 'OPTIONS'])
@jwt_required()
def dashboard_users():
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    users = User.query.filter_by(role='user').all()
    
    result = []
    for u in users:
        sessions = GameSession.query.filter_by(user_id=u.id)\
            .filter(GameSession.ended_at.isnot(None)).all()
        
        total_q = sum(s.total_questions or 0 for s in sessions)
        total_c = sum(s.correct_answers or 0 for s in sessions)
        accuracy = round((total_c / total_q * 100) if total_q else 0, 1)
        
        # Total time spent
        total_time = 0
        for s in sessions:
            if s.started_at and s.ended_at:
                total_time += (s.ended_at - s.started_at).total_seconds()
        
        # Favorite game
        game_counts = {}
        for s in sessions:
            game_counts[s.game_type] = game_counts.get(s.game_type, 0) + 1
        favorite = max(game_counts.items(), key=lambda x: x[1])[0] if game_counts else 'none'
        
        # Last active
        last_session = max(sessions, key=lambda s: s.started_at) if sessions else None
        last_active = last_session.started_at.strftime('%Y-%m-%d') if last_session else 'Never'
        
        result.append({
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'is_active': u.is_active,
            'sessions': len(sessions),
            'accuracy': accuracy,
            'total_questions': total_q,
            'correct_answers': total_c,
            'total_time_min': round(total_time / 60, 1),
            'favorite_game': favorite,
            'last_active': last_active,
        })
    
    # Sort by sessions descending
    result.sort(key=lambda x: x['sessions'], reverse=True)
    
    return jsonify({
        'users': result,
        'total': len(result),
    })


# ============================================================
# DASHBOARD — Activity over time (last 30 days)
# ============================================================
@admin_bp.route('/dashboard-timeline', methods=['GET', 'OPTIONS'])
@jwt_required()
def dashboard_timeline():
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    from datetime import timedelta
    
    end = datetime.utcnow()
    start = end - timedelta(days=30)
    
    sessions = GameSession.query.filter(
        GameSession.started_at >= start,
        GameSession.ended_at.isnot(None)
    ).all()
    
    # Group by date
    daily = {}
    for i in range(30):
        d = end - timedelta(days=29 - i)
        key = d.strftime('%Y-%m-%d')
        daily[key] = {'sessions': 0, 'total_q': 0, 'total_c': 0, 'users': set()}
    
    for s in sessions:
        key = s.started_at.strftime('%Y-%m-%d')
        if key in daily:
            daily[key]['sessions'] += 1
            daily[key]['total_q'] += s.total_questions or 0
            daily[key]['total_c'] += s.correct_answers or 0
            daily[key]['users'].add(s.user_id)
    
    timeline = []
    for key in sorted(daily.keys()):
        data = daily[key]
        accuracy = round((data['total_c'] / data['total_q'] * 100) if data['total_q'] else 0, 1)
        timeline.append({
            'date': key,
            'sessions': data['sessions'],
            'accuracy': accuracy,
            'active_users': len(data['users']),
        })
    
    return jsonify({'timeline': timeline})
