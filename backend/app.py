from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db

# Import blueprints
from routes.auth_routes import auth_bp
from routes.game_routes import game_bp
from routes.admin_routes import admin_bp
from routes.dashboard_routes import dashboard_bp
from routes.ai_routes import ai_bp
from routes.analytics_routes import analytics_bp
from routes.report_routes import report_bp
from routes.games_routes import games_bp


app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/api/*": {"origins": "*"}})
db.init_app(app)
jwt = JWTManager(app)

# Register routes
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(game_bp, url_prefix='/api/game')
app.register_blueprint(games_bp, url_prefix='/api/games')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(ai_bp, url_prefix='/api/ai')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(report_bp, url_prefix='/api/report')

@app.route('/api/health')
def health():
    return {"status": "HearWise API is running", "version": "1.0",
            "database": "SQLite (local file)"}


# ============================================================
# 🔥 AUTO-SEED FUNCTION — DB create + sample data insert
# ============================================================
def init_database():
    """Creates tables and seeds sample data on first run."""
    db.create_all()
    print("✅ Tables created (if not existing)")

    # ---- Seed Word Pairs ----
    from models.word_pair import WordPair
    if WordPair.query.count() == 0:
        sample_pairs = [
            # (pair_code, word1, word2, contrast, category, difficulty)
            ('WP01', 'ship',  'sheep', '/ɪ/ vs /iː/', 'vowel',     'easy'),
            ('WP02', 'fan',   'van',   '/f/ vs /v/',   'consonant', 'easy'),
            ('WP03', 'pat',   'bat',   '/p/ vs /b/',   'consonant', 'medium'),
            ('WP04', 'thin',  'fin',   '/θ/ vs /f/',   'consonant', 'medium'),
            ('WP05', 'bit',   'bet',   '/ɪ/ vs /e/',   'vowel',     'hard'),
            ('WP06', 'cat',   'cut',   '/æ/ vs /ʌ/',   'vowel',     'easy'),
            ('WP07', 'pin',   'pen',   '/ɪ/ vs /e/',   'vowel',     'medium'),
            ('WP08', 'sip',   'zip',   '/s/ vs /z/',   'consonant', 'easy'),
            ('WP09', 'light', 'right', '/l/ vs /r/',   'consonant', 'hard'),
            ('WP10', 'coat',  'goat',  '/k/ vs /ɡ/',   'consonant', 'medium'),
        ]
        for code, w1, w2, contrast, cat, diff in sample_pairs:
            pair = WordPair(
                pair_code=code, word1=w1, word2=w2,
                sound_contrast=contrast, category=cat,
                difficulty=diff,
                audio1_path=f"{w1}_01.mp3",
                audio2_path=f"{w2}_01.mp3",
                status='approved'
            )
            db.session.add(pair)
        db.session.commit()
        print(f"✅ {len(sample_pairs)} word pairs inserted")

    # ---- Seed Admin User ----
    from models.user import User
    if not User.query.filter_by(email='admin@hearwise.com').first():
        admin = User(username='admin', email='admin@hearwise.com', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print("✅ Admin user created: admin@hearwise.com / admin123")

    # ---- Seed Demo User ----
    if not User.query.filter_by(email='user@hearwise.com').first():
        user = User(username='demo', email='user@hearwise.com', role='user')
        user.set_password('user123')
        db.session.add(user)
        db.session.commit()
        print("✅ Demo user created: user@hearwise.com / user123")


@app.route('/static/audio/<filename>')
def serve_audio(filename):
    from flask import send_from_directory
    return send_from_directory(app.config['AUDIO_FOLDER'], filename)


if __name__ == '__main__':
    with app.app_context():
        init_database()
    print("\n🚀 HearWise API starting on http://localhost:5000\n")
    app.run(debug=True, port=5000)