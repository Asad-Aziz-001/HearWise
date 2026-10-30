import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Volume2, CheckCircle, XCircle, Home, RotateCcw, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

export default function WordPosition() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('loading');
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    api.post('/games/generate/word_position', { difficulty: 'easy', question_count: 6 })
      .then(({ data }) => {
        setSession(data.session_id);
        setQuestions(data.questions);
        setStage('playing');
      })
      .catch(() => { toast.error('Could not generate'); setStage('complete'); });
  }, []);

  const q = questions[index];

  const playAudio = () => {
    if (!q?.audio) return;
    setPlaying(true);
    const audio = new Audio(`http://localhost:5000/static/audio/${q.audio}`);
    audio.play().catch(() => toast.error('Audio failed'));
    audio.onended = () => setPlaying(false);
  };

  const handleAnswer = (pos) => {
    if (answers[String(q.question_id)]) return;
    const qid = String(q.question_id);
    setAnswers(prev => ({ ...prev, [qid]: pos }));
    setTimeout(() => {
      if (index + 1 < questions.length) setIndex(index + 1);
      else finishGame({ ...answers, [qid]: pos });
    }, 800);
  };

  const finishGame = async (allAnswers) => {
    try {
      const { data } = await api.post(`/games/auto-test/${session}`, {
        game_type: 'word_position',
        questions,
        user_answers: allAnswers || answers,
      });
      setCompleted(data);
      setStage('complete');
    } catch { toast.error('Could not complete'); navigate('/games'); }
  };

  if (stage === 'loading') {
    return (
      <div className="game-page"><Sidebar /><main className="game-main">
        <div className="game-card"><div className="game-loading">
          <div className="game-loading-spinner" />
          <p>Loading position game...</p>
        </div></div>
      </main></div>
    );
  }

  if (stage === 'complete' && completed) {
    return (
      <div className="game-page"><Sidebar /><main className="game-main">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="game-card">
          <div className="game-complete">
            <div className="game-complete-icon">{completed.accuracy >= 70 ? '📍' : '🎯'}</div>
            <h2 className="game-complete-title">Test Complete!</h2>
            <p className="game-complete-sub">{completed.ai_feedback}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, maxWidth: 400, margin: '0 auto 32px' }}>
              <div style={{ padding: 20, background: '#f5f8ff', borderRadius: 12 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#1e6ef5' }}>{completed.accuracy}%</div>
                <div style={{ fontSize: 12, color: '#5a6b8c' }}>Accuracy</div>
              </div>
              <div style={{ padding: 20, background: '#f5f8ff', borderRadius: 12 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>{completed.correct}/{completed.total}</div>
                <div style={{ fontSize: 12, color: '#5a6b8c' }}>Correct</div>
              </div>
            </div>
            <div className="game-complete-actions">
              <Link to="/games" className="game-btn-secondary"><Home size={16} /> Games Menu</Link>
              <button onClick={() => window.location.reload()} className="game-btn-primary"><RotateCcw size={16} /> Play Again</button>
            </div>
          </div>
        </motion.div>
      </main></div>
    );
  }

  const answered = q ? answers[String(q.question_id)] : null;
  const progress = ((index + 1) / questions.length) * 100;

  return (
    <div className="game-page"><Sidebar /><main className="game-main">
      <div className="game-card">
        <div className="game-header">
          <button className="game-back" onClick={() => navigate('/games')}><ArrowLeft size={16} /> Back</button>
          <div className="game-progress-wrap">
            <span className="game-progress-counter">{index + 1} / {questions.length}</span>
            <div className="game-progress-bar">
              <div className="game-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="game-body">
          <div style={{ padding: '4px 14px', background: '#eff6ff', color: '#1e6ef5', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={12} /> Listen carefully to the sentence
          </div>

          <button
            onClick={playAudio}
            disabled={playing}
            style={{
              width: 100, height: 100, borderRadius: '50%',
              background: playing ? '#9ca3af' : 'linear-gradient(135deg, #1e6ef5, #1554c9)',
              color: 'white', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(30, 110, 245, 0.3)',
            }}
          >
            <Volume2 size={40} />
          </button>
          <p style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 24 }}>
            {playing ? 'Playing...' : 'Tap to listen'}
          </p>

          <h2 className="game-question">What position is "{q.target_word}"?</h2>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(q.word_count, 4)}, 1fr)`, gap: 12, maxWidth: 500, margin: '0 auto' }}>
            {Array.from({ length: q.word_count }, (_, i) => i + 1).map((pos) => {
              const isSelected = answered === pos;
              const isCorrect = pos === q.correct;
              let bg = 'white', borderColor = '#e8f0fe', color = '#102a56';
              if (answered) {
                if (isCorrect) { bg = '#d1fae5'; borderColor = '#10b981'; color = '#059669'; }
                else if (isSelected) { bg = '#fee2e2'; borderColor = '#ef4444'; color = '#dc2626'; }
              } else if (isSelected) { bg = '#e8f0fe'; borderColor = '#1e6ef5'; }

              return (
                <button
                  key={pos}
                  onClick={() => handleAnswer(pos)}
                  disabled={!!answered}
                  style={{
                    padding: 16, borderRadius: 12,
                    background: bg, border: `2px solid ${borderColor}`,
                    fontSize: 20, fontWeight: 800, color,
                    cursor: answered ? 'default' : 'pointer',
                    fontFamily: 'Manrope',
                    transition: 'all 0.2s',
                  }}
                >
                  {pos}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {answered && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`game-result-banner ${answered === q.correct ? 'correct' : 'wrong'}`}
                style={{ marginTop: 24 }}
              >
                {answered === q.correct ? (
                  <><CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Correct!</>
                ) : (
                  <><XCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Wrong — position {q.correct}: "{q.sentence.split(' ')[q.correct - 1]}"</>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="game-footer">
          <div className="game-timer">Question {index + 1} of {questions.length}</div>
        </div>
      </div>
    </main></div>
  );
}