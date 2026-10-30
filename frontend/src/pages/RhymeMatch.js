import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Volume2, CheckCircle, XCircle, Home, RotateCcw, Repeat
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

export default function RhymeMatch() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('loading');
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    api.post('/games/generate/rhyme_match', { difficulty: 'easy', question_count: 6 })
      .then(({ data }) => {
        setSession(data.session_id);
        setQuestions(data.questions);
        setStage('playing');
      })
      .catch(() => { toast.error('Could not generate'); setStage('complete'); });
  }, []);

  const q = questions[index];

  const playAudio = (path, word) => {
    if (!path) return;
    setPlaying(word);
    const audio = new Audio(`http://localhost:5000/static/audio/${path}`);
    audio.play().catch(() => toast.error('Audio failed'));
    audio.onended = () => setPlaying(null);
  };

  const toggleSelect = (idx) => {
    if (answers[String(q.question_id)]) return;
    setSelected(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx);
      if (prev.length >= 2) return prev;
      return [...prev, idx];
    });
  };

  const handleSubmit = () => {
    if (selected.length !== 2) {
      toast.error('Select exactly 2 words');
      return;
    }
    const qid = String(q.question_id);
    setAnswers(prev => ({ ...prev, [qid]: selected }));
    setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex(index + 1);
        setSelected([]);
      } else {
        finishGame({ ...answers, [qid]: selected });
      }
    }, 800);
  };

  const finishGame = async (allAnswers) => {
    try {
      const { data } = await api.post(`/games/auto-test/${session}`, {
        game_type: 'rhyme_match',
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
          <p>Generating rhyme challenge...</p>
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
            <div className="game-complete-icon">{completed.accuracy >= 70 ? '🎼' : '🎵'}</div>
            <h2 className="game-complete-title">Rhyme Test Complete!</h2>
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
          <div style={{ padding: '4px 14px', background: '#fef3c7', color: '#b45309', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Repeat size={12} /> Select the 2 words that rhyme
          </div>

          <h2 className="game-question" style={{ marginBottom: 24 }}>
            Which two words rhyme?
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500, margin: '0 auto' }}>
            {q.options.map((word, idx) => {
              const isSelected = selected.includes(idx);
              const isAnswered = !!answered;
              const wasCorrect = answered && q.correct.includes(idx);
              const wasWrong = answered && isSelected && !q.correct.includes(idx);

              let bg = 'white';
              let borderColor = '#e8f0fe';
              if (isSelected && !answered) { bg = '#f5f3ff'; borderColor = '#a855f7'; }
              if (wasCorrect) { bg = '#d1fae5'; borderColor = '#10b981'; }
              if (wasWrong) { bg = '#fee2e2'; borderColor = '#ef4444'; }

              return (
                <div key={idx} style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => playAudio(q.audios[idx], `audio-${idx}`)}
                    style={{
                      width: 48, height: 48, borderRadius: 10,
                      background: 'linear-gradient(135deg, #1e6ef5, #1554c9)',
                      color: 'white', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Volume2 size={20} />
                  </button>
                  <button
                    onClick={() => toggleSelect(idx)}
                    disabled={isAnswered}
                    style={{
                      flex: 1, padding: 16, borderRadius: 12,
                      background: bg, border: `2px solid ${borderColor}`,
                      fontSize: 18, fontWeight: 700, color: '#102a56',
                      cursor: isAnswered ? 'default' : 'pointer',
                      textAlign: 'left', fontFamily: 'Manrope',
                      transition: 'all 0.2s',
                    }}
                  >
                    {word}
                  </button>
                </div>
              );
            })}
          </div>

          {!answered && (
            <button
              onClick={handleSubmit}
              disabled={selected.length !== 2}
              style={{
                display: 'block', margin: '24px auto 0',
                padding: '12px 32px',
                background: selected.length === 2 ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : '#9ca3af',
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 700,
                cursor: selected.length === 2 ? 'pointer' : 'not-allowed',
              }}
            >
              Submit ({selected.length}/2)
            </button>
          )}

          {answered && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`game-result-banner ${answered.length === 2 && answered.every(i => q.correct.includes(i)) && answered.length === q.correct.length ? 'correct' : 'wrong'}`}
              style={{ marginTop: 24 }}
            >
              {answered.length === 2 && answered.every(i => q.correct.includes(i)) ? (
                <><CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Correct!</>
              ) : (
                <><XCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Correct pair: {q.correct.map(i => q.options[i]).join(' + ')}</>
              )}
            </motion.div>
          )}
        </div>

        <div className="game-footer">
          <div className="game-timer">Question {index + 1} of {questions.length}</div>
        </div>
      </div>
    </main></div>
  );
}