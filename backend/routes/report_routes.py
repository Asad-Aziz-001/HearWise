from flask import Blueprint, send_file, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.game import GameSession
from models.performance import PerformanceSummary
from models.user import User
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
)
from reportlab.lib.units import inch
from datetime import datetime, timedelta
import io
import os

# Matplotlib (headless mode for server)
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

report_bp = Blueprint('report', __name__)

# ============ CHART GENERATORS ============
def create_accuracy_trend_chart(sessions, width=6.5, height=2.8):
    """Line chart of accuracy over sessions."""
    if not sessions:
        return None
    accuracies = []
    labels = []
    for i, s in enumerate(sessions):
        if s.total_questions:
            accuracies.append((s.correct_answers / s.total_questions) * 100)
            labels.append(f"S{i+1}")

    fig, ax = plt.subplots(figsize=(width, height), dpi=100)
    ax.plot(labels, accuracies, marker='o', color='#1e6ef5', linewidth=2.5, markersize=6)
    ax.fill_between(range(len(labels)), accuracies, alpha=0.15, color='#1e6ef5')
    ax.set_ylim(0, 100)
    ax.set_ylabel('Accuracy (%)', fontsize=9, color='#5a6b8c')
    ax.set_xlabel('Session', fontsize=9, color='#5a6b8c')
    ax.set_title('Accuracy Trend (Last Sessions)', fontsize=11, fontweight='bold', color='#102a56')
    ax.grid(True, alpha=0.3, linestyle='--')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.xticks(fontsize=8, color='#5a6b8c')
    plt.yticks(fontsize=8, color='#5a6b8c')
    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    plt.close()
    buf.seek(0)
    return buf


def create_sound_contrast_chart(sound_perf, width=6.5, height=3.2):
    """Horizontal bar chart of sound contrast accuracy."""
    if not sound_perf:
        return None

    data = [
        (p.sound_contrast or 'N/A',
         (p.correct_attempts / p.total_attempts * 100) if p.total_attempts else 0)
        for p in sound_perf if p.total_attempts
    ]
    if not data:
        return None

    data.sort(key=lambda x: x[1], reverse=False)
    labels = [d[0] for d in data]
    values = [d[1] for d in data]

    # Colors based on performance
    bar_colors = ['#ef4444' if v < 50 else '#f59e0b' if v < 70 else '#10b981' for v in values]

    fig, ax = plt.subplots(figsize=(width, height), dpi=100)
    ax.barh(labels, values, color=bar_colors, edgecolor='none')
    for i, v in enumerate(values):
        ax.text(v + 1, i, f'{v:.1f}%', va='center', fontsize=8, color='#102a56', fontweight='bold')
    ax.set_xlim(0, 110)
    ax.set_xlabel('Accuracy (%)', fontsize=9, color='#5a6b8c')
    ax.set_title('Sound Contrast Performance', fontsize=11, fontweight='bold', color='#102a56')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.xticks(fontsize=8, color='#5a6b8c')
    plt.yticks(fontsize=8, color='#5a6b8c')
    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    plt.close()
    buf.seek(0)
    return buf


def create_game_distribution_pie(sessions, width=4, height=3):
    """Pie chart for game type distribution."""
    if not sessions:
        return None
    word_count = sum(1 for s in sessions if s.game_type == 'word_discrimination')
    seq_count = sum(1 for s in sessions if s.game_type == 'sequence_memory')

    if word_count + seq_count == 0:
        return None

    labels = []
    sizes = []
    colors_pie = []
    if word_count:
        labels.append(f'Similar Words\n({word_count})')
        sizes.append(word_count)
        colors_pie.append('#1e6ef5')
    if seq_count:
        labels.append(f'Sequence Memory\n({seq_count})')
        sizes.append(seq_count)
        colors_pie.append('#a855f7')

    fig, ax = plt.subplots(figsize=(width, height), dpi=100)
    ax.pie(sizes, labels=labels, colors=colors_pie, autopct='%1.0f%%',
           startangle=90, textprops={'fontsize': 8, 'color': '#102a56'})
    ax.set_title('Game Type Distribution', fontsize=11, fontweight='bold', color='#102a56')
    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    plt.close()
    buf.seek(0)
    return buf


# ============ MAIN PDF ENDPOINT ============
@report_bp.route('/pdf', methods=['GET'])
@jwt_required()
def generate_pdf():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    sessions = GameSession.query.filter_by(user_id=user_id)\
        .filter(GameSession.ended_at.isnot(None))\
        .order_by(GameSession.started_at.asc()).all()

    perf = PerformanceSummary.query.filter_by(user_id=user_id).all()

    # ============ CALCULATIONS ============
    total = len(sessions)
    total_q = sum(s.total_questions for s in sessions if s.total_questions)
    total_c = sum(s.correct_answers for s in sessions if s.total_questions)
    avg_acc = (total_c / total_q * 100) if total_q else 0

    # Total focus time
    total_seconds = 0
    for s in sessions:
        if s.started_at and s.ended_at:
            total_seconds += (s.ended_at - s.started_at).total_seconds()

    # Weak areas
    weak = sorted(
        [p for p in perf if p.total_attempts and p.total_attempts >= 2],
        key=lambda p: (p.correct_attempts / p.total_attempts) if p.total_attempts else 1
    )[:8]

    # Game breakdown
    word_count = sum(1 for s in sessions if s.game_type == 'word_discrimination')
    seq_count = sum(1 for s in sessions if s.game_type == 'sequence_memory')
    word_acc = (
        sum(s.correct_answers for s in sessions if s.game_type == 'word_discrimination' and s.total_questions) /
        max(1, sum(s.total_questions for s in sessions if s.game_type == 'word_discrimination' and s.total_questions))
        * 100
    )
    seq_acc = (
        sum(s.correct_answers for s in sessions if s.game_type == 'sequence_memory' and s.total_questions) /
        max(1, sum(s.total_questions for s in sessions if s.game_type == 'sequence_memory' and s.total_questions))
        * 100
    )

    # Trend
    trend = 'stable'
    if len(sessions) >= 4:
        recent = sessions[-2:]
        older = sessions[-4:-2]
        recent_acc = sum(s.correct_answers / s.total_questions for s in recent if s.total_questions) / max(1, len(recent))
        older_acc = sum(s.correct_answers / s.total_questions for s in older if s.total_questions) / max(1, len(older))
        if recent_acc > older_acc + 0.05:
            trend = 'improving'
        elif recent_acc < older_acc - 0.05:
            trend = 'declining'

    # ============ BUILD PDF ============
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=0.6*inch, bottomMargin=0.6*inch,
        leftMargin=0.6*inch, rightMargin=0.6*inch
    )
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle', parent=styles['Title'],
        fontSize=22, textColor=colors.HexColor('#1e6ef5'),
        spaceAfter=4, alignment=0
    )
    subtitle_style = ParagraphStyle(
        'Subtitle', parent=styles['Normal'],
        fontSize=10, textColor=colors.HexColor('#5a6b8c'),
        spaceAfter=12
    )
    h2_style = ParagraphStyle(
        'H2Custom', parent=styles['Heading2'],
        fontSize=14, textColor=colors.HexColor('#102a56'),
        spaceBefore=14, spaceAfter=8
    )
    footer_style = ParagraphStyle(
        'Footer', parent=styles['Normal'],
        fontSize=8, textColor=colors.grey, alignment=1
    )

    story = []

    # ============ HEADER ============
    story.append(Paragraph("HearWise", title_style))
    story.append(Paragraph(
        f"Listening Practice Performance Report<br/>"
        f"<b>{user.username}</b> · {user.email}",
        subtitle_style
    ))

    # Meta line
    story.append(Paragraph(
        f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} · "
        f"Total Sessions: {total} · Total Questions: {total_q}",
        ParagraphStyle('meta', parent=styles['Normal'], fontSize=9, textColor=colors.grey)
    ))
    story.append(Spacer(1, 16))

    # ============ 1. SUMMARY ============
    story.append(Paragraph("1. Performance Summary", h2_style))

    summary_data = [
        ['Metric', 'Value', 'Status'],
        ['Total Sessions', str(total), '✅ Good'],
        ['Total Questions Answered', str(total_q), '—'],
        ['Total Correct', f'{total_c}', f'{(total_c / total_q * 100) if total_q else 0:.1f}%'],
        ['Overall Accuracy', f'{avg_acc:.1f}%', '🏆 Great' if avg_acc >= 70 else '📊 Average' if avg_acc >= 50 else '⚠️ Needs Focus'],
        ['Total Practice Time', f'{round(total_seconds / 60, 1)} minutes', '—'],
        ['Current Level', f'Level {min(5, total // 5 + 1)}', '—'],
        ['Trend', trend.capitalize(), '📈' if trend == 'improving' else '📉' if trend == 'declining' else '➡️'],
    ]
    t = Table(summary_data, colWidths=[2.4*inch, 2*inch, 1.8*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e6ef5')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e8f0fe')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8faff')]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t)

    # ============ 2. CHARTS ============
    story.append(Paragraph("2. Performance Charts", h2_style))

    # Trend chart
    trend_buf = create_accuracy_trend_chart(sessions[-15:] if len(sessions) > 15 else sessions)
    if trend_buf:
        story.append(Image(trend_buf, width=6.8*inch, height=2.9*inch))
        story.append(Spacer(1, 8))

    # Sound contrast chart
    contrast_buf = create_sound_contrast_chart(perf)
    if contrast_buf:
        story.append(Image(contrast_buf, width=6.8*inch, height=3.3*inch))
        story.append(Spacer(1, 8))

    # Game distribution pie
    pie_buf = create_game_distribution_pie(sessions)
    if pie_buf:
        story.append(Spacer(1, 8))
        story.append(Image(pie_buf, width=3.5*inch, height=2.6*inch))

    story.append(PageBreak())

    # ============ 3. WEAK AREAS ============
    story.append(Paragraph("3. Areas Needing Practice (Weaknesses)", h2_style))

    if weak:
        story.append(Paragraph(
            "These sound contrasts show the lowest accuracy. Focus practice on these to improve overall performance.",
            ParagraphStyle('hint', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#5a6b8c'))
        ))
        story.append(Spacer(1, 8))

        weak_data = [['Sound Contrast', 'Attempts', 'Correct', 'Accuracy', 'Severity']]
        for p in weak:
            if p.total_attempts:
                acc = (p.correct_attempts / p.total_attempts) * 100
                sev = '🔴 High' if acc < 50 else '🟡 Medium' if acc < 70 else '🟢 Low'
                weak_data.append([
                    p.sound_contrast or 'N/A',
                    str(p.total_attempts),
                    str(p.correct_attempts),
                    f'{acc:.1f}%',
                    sev,
                ])

        tw = Table(weak_data, colWidths=[2*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1.2*inch])
        tw.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ef4444')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e8f0fe')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fef2f2')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(tw)
    else:
        story.append(Paragraph("No weak areas detected — keep it up! 🌟", styles['Normal']))

    # ============ 4. GAME BREAKDOWN ============
    story.append(Paragraph("4. Game Type Breakdown", h2_style))

    game_data = [
        ['Game Type', 'Sessions', 'Accuracy'],
        ['🎧 Similar-Sounding Words', str(word_count), f'{word_acc:.1f}%'],
        ['🧠 Sequence Memory', str(seq_count), f'{seq_acc:.1f}%'],
    ]
    tg = Table(game_data, colWidths=[3*inch, 1.5*inch, 1.5*inch])
    tg.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#a855f7')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e8f0fe')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f3ff')]),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(tg)

    story.append(PageBreak())

    # ============ 5. SESSION HISTORY ============
    story.append(Paragraph("5. Recent Session History (Last 15)", h2_style))

    if sessions:
        history_data = [['Date', 'Game', 'Difficulty', 'Correct', 'Accuracy']]
        for s in sessions[-15:][::-1]:
            acc = (s.correct_answers / s.total_questions * 100) if s.total_questions else 0
            history_data.append([
                s.started_at.strftime('%Y-%m-%d %H:%M'),
                '🎧 Similar' if s.game_type == 'word_discrimination' else '🧠 Sequence',
                (s.difficulty_level or 'easy').capitalize(),
                f'{s.correct_answers or 0}/{s.total_questions or 0}',
                f'{acc:.1f}%',
            ])

        th = Table(history_data, colWidths=[1.7*inch, 1.4*inch, 1.1*inch, 1*inch, 1*inch])
        th.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e8f0fe')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0fdf4')]),
            ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(th)

    # ============ 6. RECOMMENDATIONS ============
    story.append(Paragraph("6. Recommendations", h2_style))

    recommendations = []
    if avg_acc >= 80:
        recommendations.append("🏆 Excellent performance! Try harder difficulty levels.")
    elif avg_acc >= 60:
        recommendations.append("📊 Good progress. Focus on weak contrasts to reach 80%.")
    else:
        recommendations.append("⚠️ Slow down and review audio carefully. Try easy difficulty.")

    if weak:
        recommendations.append(f"🎯 Priority focus: {weak[0].sound_contrast or 'N/A'} (lowest accuracy).")
    if trend == 'declining':
        recommendations.append("📉 Recent trend is declining — consider shorter, more frequent sessions.")
    elif trend == 'improving':
        recommendations.append("📈 You're improving! Keep the momentum going.")

    rec_style = ParagraphStyle(
        'Rec', parent=styles['Normal'], fontSize=10,
        leftIndent=12, spaceAfter=6
    )
    for r in recommendations:
        story.append(Paragraph(r, rec_style))

    story.append(Spacer(1, 20))

    # ============ FOOTER ============
    story.append(Paragraph(
        "— End of Report —<br/>"
        "This report was generated automatically by HearWise. "
        "It is for practice monitoring only and NOT a clinical assessment.",
        footer_style
    ))

    doc.build(story)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f'hearwise_report_{user.username}_{datetime.utcnow().strftime("%Y%m%d")}.pdf',
        mimetype='application/pdf'
    )


# ============================================================
# ADMIN — All users reports summary
# ============================================================
@report_bp.route('/admin/users', methods=['GET', 'OPTIONS'])
@jwt_required()
def admin_users_reports():
    from flask import request as req
    if req.method == 'OPTIONS':
        return jsonify({'ok': True}), 200
    
    from models.user import User
    from models.game import GameSession
    from models.performance import PerformanceSummary
    from models import db
    
    # Check admin
    user_id = int(get_jwt_identity())
    admin = User.query.get(user_id)
    if not admin or admin.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    # Get all non-admin users
    users = User.query.filter_by(role='user').order_by(User.created_at.desc()).all()
    
    result = []
    for u in users:
        sessions = GameSession.query.filter_by(user_id=u.id)\
            .filter(GameSession.ended_at.isnot(None)).all()
        
        total_q = sum(s.total_questions or 0 for s in sessions)
        total_c = sum(s.correct_answers or 0 for s in sessions)
        accuracy = round((total_c / total_q * 100) if total_q else 0, 1)
        
        last_session = max(sessions, key=lambda s: s.started_at) if sessions else None
        last_active = last_session.started_at.strftime('%Y-%m-%d %H:%M') if last_session else 'Never'
        
        perf = PerformanceSummary.query.filter_by(user_id=u.id)\
            .filter(PerformanceSummary.total_attempts >= 3).all()
        weak_count = sum(1 for p in perf if p.total_attempts and (p.correct_attempts / p.total_attempts) < 0.6)
        
        result.append({
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'is_active': u.is_active,
            'total_sessions': len(sessions),
            'total_questions': total_q,
            'correct_answers': total_c,
            'accuracy': accuracy,
            'weak_areas': weak_count,
            'last_active': last_active,
        })
    
    return jsonify({'users': result, 'total': len(result)})


# ============================================================
# ADMIN — Download any user's FULL PDF report
# ============================================================
@report_bp.route('/admin/user/<int:target_user_id>/pdf', methods=['GET'])
@jwt_required()
def admin_download_user_pdf(target_user_id):
    """Admin can download detailed PDF for any user."""
    from models.user import User
    from models.game import GameSession, Attempt
    from models.performance import PerformanceSummary
    from flask import send_file
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
    )
    from reportlab.lib.units import inch
    from datetime import datetime
    import io
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import numpy as np
    
    # Check admin
    admin_id = int(get_jwt_identity())
    admin = User.query.get(admin_id)
    if not admin or admin.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    # Get target user
    target_user = User.query.get(target_user_id)
    if not target_user:
        return jsonify({'error': 'User not found'}), 404
    
    sessions = GameSession.query.filter_by(user_id=target_user_id)\
        .filter(GameSession.ended_at.isnot(None))\
        .order_by(GameSession.started_at.asc()).all()
    
    perf = PerformanceSummary.query.filter_by(user_id=target_user_id).all()
    
    # ============ CALCULATIONS ============
    total = len(sessions)
    total_q = sum(s.total_questions for s in sessions if s.total_questions)
    total_c = sum(s.correct_answers for s in sessions if s.total_questions)
    avg_acc = (total_c / total_q * 100) if total_q else 0
    
    total_seconds = sum(
        (s.ended_at - s.started_at).total_seconds()
        for s in sessions if s.started_at and s.ended_at
    )
    
    weak = sorted(
        [p for p in perf if p.total_attempts and p.total_attempts >= 2],
        key=lambda p: (p.correct_attempts / p.total_attempts) if p.total_attempts else 1
    )[:8]
    
    # Game breakdown
    game_breakdown = {}
    for s in sessions:
        gt = s.game_type
        if gt not in game_breakdown:
            game_breakdown[gt] = {'sessions': 0, 'total_q': 0, 'total_c': 0}
        game_breakdown[gt]['sessions'] += 1
        game_breakdown[gt]['total_q'] += s.total_questions or 0
        game_breakdown[gt]['total_c'] += s.correct_answers or 0
    
    # ============ CHART GENERATORS ============
    
    def create_trend_chart():
        """Accuracy trend chart."""
        if not sessions:
            return None
        
        accs = []
        labels = []
        for i, s in enumerate(sessions):
            if s.total_questions:
                accs.append((s.correct_answers / s.total_questions) * 100)
                labels.append(f"S{i+1}")
        
        if not accs:
            return None
        
        fig, ax = plt.subplots(figsize=(7, 2.8), dpi=100)
        ax.plot(labels, accs, marker='o', color='#1e6ef5', linewidth=2.5, markersize=6)
        ax.fill_between(range(len(labels)), accs, alpha=0.15, color='#1e6ef5')
        ax.set_ylim(0, 100)
        ax.set_ylabel('Accuracy (%)', fontsize=9, color='#5a6b8c')
        ax.set_xlabel('Session', fontsize=9, color='#5a6b8c')
        ax.set_title('Accuracy Trend', fontsize=11, fontweight='bold', color='#102a56')
        ax.grid(True, alpha=0.3, linestyle='--')
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        plt.xticks(fontsize=8, color='#5a6b8c')
        plt.yticks(fontsize=8, color='#5a6b8c')
        plt.tight_layout()
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
        plt.close()
        buf.seek(0)
        return buf
    
    def create_contrast_chart():
        """Sound contrast performance chart."""
        if not perf:
            return None
        
        data = []
        for p in perf:
            if p.total_attempts and p.total_attempts > 0:
                acc = (p.correct_attempts / p.total_attempts) * 100
                data.append((p.sound_contrast or 'N/A', acc))
        
        if not data:
            return None
        
        data.sort(key=lambda x: x[1])
        labels = [d[0] for d in data]
        values = [d[1] for d in data]
        bar_colors = ['#ef4444' if v < 50 else '#f59e0b' if v < 70 else '#10b981' for v in values]
        
        fig, ax = plt.subplots(figsize=(7, max(2.5, len(data) * 0.4)), dpi=100)
        ax.barh(labels, values, color=bar_colors)
        
        for i, v in enumerate(values):
            ax.text(v + 1, i, f'{v:.0f}%', va='center', fontsize=8, color='#102a56', fontweight='bold')
        
        ax.set_xlim(0, 110)
        ax.set_xlabel('Accuracy (%)', fontsize=9, color='#5a6b8c')
        ax.set_title('Sound Contrast Performance', fontsize=11, fontweight='bold', color='#102a56')
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        plt.xticks(fontsize=8, color='#5a6b8c')
        plt.yticks(fontsize=8, color='#5a6b8c')
        plt.tight_layout()
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
        plt.close()
        buf.seek(0)
        return buf
    
    def create_game_pie():
        """Game distribution pie."""
        if not game_breakdown:
            return None
        
        labels = []
        sizes = []
        colors_pie = []
        palette = ['#1e6ef5', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6']
        
        for i, (gt, data) in enumerate(game_breakdown.items()):
            name = gt.replace('_', ' ').title()
            labels.append(f"{name} ({data['sessions']})")
            sizes.append(data['sessions'])
            colors_pie.append(palette[i % len(palette)])
        
        fig, ax = plt.subplots(figsize=(4, 3), dpi=100)
        ax.pie(sizes, labels=labels, colors=colors_pie, autopct='%1.0f%%',
               startangle=90, textprops={'fontsize': 8, 'color': '#102a56'})
        ax.set_title('Games Played', fontsize=11, fontweight='bold', color='#102a56')
        plt.tight_layout()
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
        plt.close()
        buf.seek(0)
        return buf
    
    # ============ BUILD PDF ============
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=0.5*inch, bottomMargin=0.5*inch,
        leftMargin=0.5*inch, rightMargin=0.5*inch
    )
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('CustomTitle', parent=styles['Title'], fontSize=22, textColor=colors.HexColor('#1e6ef5'), spaceAfter=4, alignment=0)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#5a6b8c'), spaceAfter=12)
    h2_style = ParagraphStyle('H2Custom', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#102a56'), spaceBefore=14, spaceAfter=8)
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey, alignment=1)
    
    story = []
    
    # ============ HEADER ============
    story.append(Paragraph("HearWise — User Report", title_style))
    story.append(Paragraph(
        f"<b>User:</b> {target_user.username}<br/>"
        f"<b>Email:</b> {target_user.email}<br/>"
        f"<b>Role:</b> {target_user.role} &nbsp;·&nbsp; "
        f"<b>Status:</b> {'Active' if target_user.is_active else 'Inactive'}",
        subtitle_style
    ))
    story.append(Paragraph(
        f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} &nbsp;·&nbsp; "
        f"Requested by admin: <b>{admin.username}</b>",
        ParagraphStyle('meta', parent=styles['Normal'], fontSize=9, textColor=colors.grey)
    ))
    story.append(Spacer(1, 16))
    
    # ============ SUMMARY ============
    story.append(Paragraph("1. Performance Summary", h2_style))
    summary_data = [
        ['Metric', 'Value', 'Status'],
        ['Total Sessions', str(total), '—'],
        ['Total Questions', str(total_q), '—'],
        ['Correct Answers', f'{total_c}', f'{(total_c/total_q*100) if total_q else 0:.1f}%'],
        ['Accuracy', f'{avg_acc:.1f}%', 'Excellent' if avg_acc >= 70 else 'Good' if avg_acc >= 50 else 'Needs Focus'],
        ['Time Spent', f'{round(total_seconds/60, 1)} min', '—'],
        ['Games Played', f'{len(game_breakdown)} types', '—'],
    ]
    t = Table(summary_data, colWidths=[2.5*inch, 2*inch, 2*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e6ef5')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e8f0fe')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8faff')]),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t)
    
    # ============ CHARTS ============
    story.append(Paragraph("2. Performance Charts", h2_style))
    
    trend_buf = create_trend_chart()
    if trend_buf:
        story.append(Image(trend_buf, width=6.8*inch, height=2.9*inch))
        story.append(Spacer(1, 8))
    
    contrast_buf = create_contrast_chart()
    if contrast_buf:
        story.append(Image(contrast_buf, width=6.8*inch, height=max(2.5, len(perf) * 0.4)*inch))
        story.append(Spacer(1, 8))
    
    story.append(PageBreak())
    
    # ============ WEAK AREAS ============
    story.append(Paragraph("3. Areas Needing Practice", h2_style))
    
    if weak:
        story.append(Paragraph(
            "These sound contrasts show the lowest accuracy. Focus practice here to improve.",
            ParagraphStyle('hint', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#5a6b8c'))
        ))
        story.append(Spacer(1, 8))
        
        weak_data = [['Sound Contrast', 'Attempts', 'Correct', 'Accuracy', 'Severity']]
        for p in weak:
            if p.total_attempts:
                acc = (p.correct_attempts / p.total_attempts) * 100
                sev = 'High' if acc < 50 else 'Medium' if acc < 70 else 'Low'
                weak_data.append([
                    p.sound_contrast or 'N/A',
                    str(p.total_attempts),
                    str(p.correct_attempts),
                    f'{acc:.1f}%',
                    sev,
                ])
        
        tw = Table(weak_data, colWidths=[2*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1.2*inch])
        tw.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ef4444')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e8f0fe')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fef2f2')]),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(tw)
    else:
        story.append(Paragraph("No weak areas detected — keep it up!", styles['Normal']))
    
    # ============ GAME BREAKDOWN ============
    story.append(Paragraph("4. Game Type Breakdown", h2_style))
    
    if game_breakdown:
        game_data = [['Game Type', 'Sessions', 'Questions', 'Accuracy']]
        for gt, data in sorted(game_breakdown.items(), key=lambda x: -x[1]['sessions']):
            acc = (data['total_c'] / data['total_q'] * 100) if data['total_q'] else 0
            name = gt.replace('_', ' ').title()
            game_data.append([name, str(data['sessions']), str(data['total_q']), f'{acc:.1f}%'])
        
        tg = Table(game_data, colWidths=[2.5*inch, 1.2*inch, 1.2*inch, 1.5*inch])
        tg.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#a855f7')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e8f0fe')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f3ff')]),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(tg)
        
        # Pie chart
        pie_buf = create_game_pie()
        if pie_buf:
            story.append(Spacer(1, 8))
            story.append(Image(pie_buf, width=3.5*inch, height=2.6*inch))
    
    story.append(PageBreak())
    
    # ============ SESSION HISTORY ============
    story.append(Paragraph("5. Recent Session History (Last 15)", h2_style))
    
    if sessions:
        history_data = [['Date', 'Game', 'Difficulty', 'Correct', 'Accuracy']]
        for s in sessions[-15:][::-1]:
            acc = (s.correct_answers / s.total_questions * 100) if s.total_questions else 0
            history_data.append([
                s.started_at.strftime('%Y-%m-%d %H:%M'),
                s.game_type.replace('_', ' ').title()[:20],
                (s.difficulty_level or 'easy').capitalize(),
                f'{s.correct_answers or 0}/{s.total_questions or 0}',
                f'{acc:.1f}%',
            ])
        
        th = Table(history_data, colWidths=[1.7*inch, 1.8*inch, 1.1*inch, 1*inch, 1*inch])
        th.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e8f0fe')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0fdf4')]),
            ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(th)
    else:
        story.append(Paragraph("No sessions played yet.", styles['Normal']))
    
    # ============ RECOMMENDATIONS ============
    story.append(Paragraph("6. Recommendations", h2_style))
    
    recs = []
    if avg_acc >= 80:
        recs.append("Excellent performance! Try harder difficulty levels.")
    elif avg_acc >= 60:
        recs.append("Good progress. Focus on weak contrasts to reach 80%.")
    elif total > 0:
        recs.append("Slow down and review audio carefully. Try easy difficulty.")
    
    if weak:
        recs.append(f"Priority focus: {weak[0].sound_contrast} (lowest accuracy).")
    
    rec_style = ParagraphStyle('Rec', parent=styles['Normal'], fontSize=10, leftIndent=12, spaceAfter=6)
    for r in recs:
        story.append(Paragraph(f"• {r}", rec_style))
    
    story.append(Spacer(1, 20))
    
    # ============ FOOTER ============
    story.append(Paragraph(
        "— End of Report —<br/>"
        "This report was generated automatically by HearWise Admin Panel. "
        "It is for practice monitoring only and NOT a clinical assessment.",
        footer_style
    ))
    
    doc.build(story)
    buffer.seek(0)
    
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f'hearwise_report_{target_user.username}_{datetime.utcnow().strftime("%Y%m%d")}.pdf',
        mimetype='application/pdf'
    )