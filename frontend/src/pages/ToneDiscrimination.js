import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Volume2, CheckCircle, XCircle, Home, RotateCcw,
  Music, Play, Pause
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

export default function ToneDiscrimination() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('loading');
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(null);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    api.post('/games/generate/tone_discrimination', { difficulty: 'easy', question_count: 8 })
      .then(({ data }) => {
        setSession(data.session_id);
        setQuestions(data.questions);
        setStage('playing');
      })
      .catch(() => { toast.error('Could not generate game'); setStage('complete'); });
  }, []);

  const playTone = (path, toneId) => {
    if (!path) return;
    setPlaying(toneId);
    const audio = new Audio(`http://localhost:5000/static/audio/${path}`);
    audio.play().catch(() => toast.error('Audio failed'));
    audio.onended = () => setPlaying(null);
  };

  const handleAnswer = (answer) => {
    if (answers[String(questions[index].question_id)]) return;
    const qid = String(questions[index].question_id);
    setAnswers(prev => ({ ...prev, [qid]: answer }));
    setTimeout(() => {
      if (index + 1 < questions.length) setIndex(index + 1);
      else finishGame();
    }, 500);
  };

  const finishGame = async () => {
    try {
      const { data } = await api.post(`/games/auto-test/${session}`, {
        game_type: 'tone_discrimination',
        questions,
        user_answers: answers,
      });
      setCompleted(data);
      setStage('complete');
    } catch { toast.error('Could not complete'); navigate('/games'); }
  };

  const q = questions[index];

  if (stage === 'loading') {
    return (
      <div className="game-page"><Sidebar /><main className="game-main">
        <div className="game-card"><div className="game-loading">
          <div className="game-loading-spinner" />
          <p>Generating tones...</p>
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
            <div className="game-complete-icon">{completed.accuracy >= 70 ? '🎵' : '🎶'}</div>
            <h2 className="game-complete-title">Tone Test Complete!</h2>
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
          <div style={{ padding: '4px 14px', background: '#f5f3ff', color: '#7c3aed', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Music size={12} /> Are these two tones the same or different?
          </div>

          <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
            {[0, 1].map((i) => {
              const audioKey = i === 0 ? 'audio_a' : 'audio_b';
              const freqKey = i === 0 ? 'freq_a' : 'freq_b';
              const label = i === 0 ? 'A' : 'B';
              return (
                <div key={i} style={{ textAlign: 'center' }}>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => playTone(q[audioKey], `${label}-${index}`)}
                    disabled={answered}
                    style={{
                      width: 90, height: 90, borderRadius: '50%',
                      background: playing === `${label}-${index}` ? '#ef4444' : 'linear-gradient(135deg, #a855f7, #7c3aed)',
                      color: 'white', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(168, 85, 247, 0.35)',
                    }}
                  >
                    <Volume2 size={36} />
                  </motion.button>
                  <p style={{ fontSize: 13, color: '#5a6b8c', marginTop: 8, fontWeight: 600 }}>
                    Tone {label}
                  </p>
                  <p style={{ fontSize: 11, color: '#8a9ab5' }}>{q[freqKey]} Hz</p>
                </div>
              );
            })}
          </div>

          <h2 className="game-question">Same or different?</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 500, margin: '0 auto' }}>
            {['same', 'different'].map((opt) => {
              const isSelected = answered === opt;
              const isCorrect = opt === q.correct;
              let cls = 'default';
              if (answered) {
                if (isSelected && isCorrect) cls = 'correct';
                else if (isSelected && !isCorrect) cls = 'wrong';
                else if (!isSelected && isCorrect) cls = 'correct';
              }
              return (
                <button
                  key={opt}
                  className={`game-option ${cls}`}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!answered}
                >
                  {opt === 'same' ? 'Same' : 'Different'}
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
                {answered === q.correct ? <CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> : <XCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />}
                {answered === q.correct ? 'Correct!' : `Wrong — tones were ${q.correct}`}
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