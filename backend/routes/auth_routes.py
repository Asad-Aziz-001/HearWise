from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db
from models.user import User

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    
    # ✅ Check email
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    # ✅ Check username (NEW)
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 400
    
    user = User(username=data['username'], email=data['email'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Registered successfully', 'user': user.to_dict()}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401

    # ✅ identity MUST be string
    token = create_access_token(identity=str(user.id))

    # ✅ Response MUST have 'token' key (match frontend)
    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET', 'OPTIONS'])
@jwt_required(optional=True)
def me():
    from flask import request as req
    
    if req.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    try:
        identity = get_jwt_identity()
        if not identity:
            return jsonify({'error': 'No token provided'}), 401
        
        user_id = int(identity)
        user = User.query.get(user_id)
        
        # ✅ Check if user exists
        if not user:
            return jsonify({'error': 'User not found — please login again'}), 401
        
        return jsonify(user.to_dict()), 200
    
    except Exception as e:
        print(f"❌ /me error: {e}")
        return jsonify({'error': str(e)}), 401