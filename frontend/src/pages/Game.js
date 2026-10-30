import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Volume2, Clock, SkipForward, Home,
  RotateCcw, CheckCircle, XCircle, Brain
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

export default function Game() {
  const { type } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [completed, setCompleted] = useState(null);
  const [loading, setLoading] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(Date.now());
  const timerRef = useRef(null);

  // Load game
  useEffect(() => {
    setLoading(true);
    setSession(null);
    setQuestions([]);
    setIndex(0);
    setCompleted(null);

    api.post('/game/start', { game_type: type, difficulty: 'easy' })
      .then(({ data }) => {
        setSession(data.session_id);
        setQuestions(data.questions);
        setLoading(false);
        startTime.current = Date.now();
      })
      .catch(() => {
        toast.error('Could not start game');
        setLoading(false);
      });
  }, [type]);

  // Timer
  useEffect(() => {
    if (loading || completed) return;
    timerRef.current = setInterval(() => {
      setElapsed(((Date.now() - startTime.current) / 1000).toFixed(1));
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [loading, completed, index]);

  const playAudio = (path) => {
    if (!path) {
      toast.error('Audio not available');
      return;
    }
    setAudioPlaying(true);
    const audio = new Audio(`http://localhost:5000/static/audio/${path}`);
    audio.play().catch(() => toast.error('Could not play audio'));
    audio.onended = () => setAudioPlaying(false);
  };

  const handleAnswer = async (choice) => {
    if (selected || result) return;
    setSelected(choice);
    const q = questions[index];
    const rt = Date.now() - startTime.current;

    try {
      const { data } = await api.post(`/game/submit/${session}`, {
        question_id: q.question_id,
        word_pair_id: q.word_pair_id,
        answer: choice,
        correct: q.correct,
        response_time_ms: rt,
      });
      setResult(data.correct ? 'correct' : 'wrong');
      setTimeout(() => {
        if (index + 1 < questions.length) {
          setIndex(index + 1);
          setSelected(null);
          setResult(null);
          startTime.current = Date.now();
          setElapsed(0);
        } else {
          finishGame();
        }
      }, 900);
    } catch (err) {
      toast.error('Submission failed');
      setSelected(null);
    }
  };

  const skipQuestion = () => {
    if (selected || result) return;
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setSelected(null);
      setResult(null);
      startTime.current = Date.now();
      setElapsed(0);
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    try {
      const { data } = await api.post(`/game/end/${session}`);
      setCompleted(data);
    } catch (err) {
      toast.error('Could not save session');
      navigate('/dashboard');
    }
  };

  // ============ LOADING ============
  if (loading) {
    return (
      <div className="game-page">
        <Sidebar />
        <main className="game-main">
          <div className="game-card">
            <div className="game-loading">
              <div className="game-loading-spinner" />
              <p style={{ color: '#5a6b8c', fontSize: 14 }}>Preparing your practice...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ============ SESSION COMPLETE ============
  if (completed) {
    return (
      <div className="game-page">
        <Sidebar />
        <main className="game-main">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="game-card"
          >
            <div className="game-complete">
              <div className="game-complete-icon">🎉</div>
              <h2 className="game-complete-title">Session Complete!</h2>
              <p className="game-complete-sub">Great job! Here's your performance summary.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 500, margin: '0 auto 24px' }}>
                <div style={{ padding: 20, background: '#f5f8ff', borderRadius: 12 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#1e6ef5' }}>{completed.accuracy}%</div>
                  <div style={{ fontSize: 12, color: '#5a6b8c', marginTop: 4 }}>Accuracy</div>
                </div>
                <div style={{ padding: 20, background: '#f5f8ff', borderRadius: 12 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>
                    {completed.session.correct_answers}/{completed.session.total_questions}
                  </div>
                  <div style={{ fontSize: 12, color: '#5a6b8c', marginTop: 4 }}>Correct</div>
                </div>
                <div style={{ padding: 20, background: '#f5f8ff', borderRadius: 12 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#a855f7', textTransform: 'capitalize' }}>
                    {completed.next_difficulty}
                  </div>
                  <div style={{ fontSize: 12, color: '#5a6b8c', marginTop: 4 }}>Next Level</div>
                </div>
              </div>

              {/* ✅ AI ANALYSIS */}
              {completed.ai_analysis && (
                <div style={{
                  padding: 16,
                  background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)',
                  borderLeft: '4px solid #a855f7',
                  borderRadius: 8,
                  textAlign: 'left',
                  maxWidth: 500,
                  margin: '0 auto 24px',
                }}>
                  <h4 style={{
                    fontSize: 13, color: '#102a56', margin: '0 0 8px',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <Brain size={16} color="#a855f7" /> AI Analysis
                  </h4>
                  <p style={{ fontSize: 13, color: '#5a6b8c', margin: 0, lineHeight: 1.5 }}>
                    {completed.ai_analysis.reason}
                  </p>
                  <p style={{
                    fontSize: 12, color: '#a855f7',
                    margin: '8px 0 0', fontWeight: 600,
                  }}>
                    Confidence: {completed.ai_analysis.confidence}% · Next: {completed.ai_analysis.difficulty}
                  </p>
                  {completed.ai_analysis.focus_area && (
                    <p style={{ fontSize: 12, color: '#5a6b8c', margin: '4px 0 0' }}>
                      🎯 Focus: {completed.ai_analysis.focus_area}
                    </p>
                  )}
                </div>
              )}

              <div className="game-complete-actions">
                <Link to="/dashboard" className="game-btn-secondary">
                  <Home size={16} /> Back to Dashboard
                </Link>
                <button onClick={() => window.location.reload()} className="game-btn-primary">
                  <RotateCcw size={16} /> Play Again
                </button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // ============ ACTIVE GAME ============
  const q = questions[index];

  return (
    <div className="game-page">
      <Sidebar />
      <main className="game-main">
        <div className="game-card">
          <div className="game-header">
            <button className="game-back" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={16} /> Back
            </button>
            <div className="game-progress-wrap">
              <span className="game-progress-counter">{index + 1} / {questions.length}</span>
              <div className="game-progress-bar">
                <motion.div
                  className="game-progress-fill"
                  initial={false}
                  animate={{ width: `${((index + 1) / questions.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          <div className="game-body">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
              >
                <button
                  className={`game-audio-btn ${audioPlaying ? 'playing' : ''}`}
                  onClick={() => playAudio(q.audio_a)}
                  aria-label="Play audio"
                >
                  <Volume2 size={36} />
                </button>
                <div className="game-audio-label">
                  {audioPlaying ? 'Playing...' : 'Listen to the word'}
                </div>
                <h2 className="game-question">Which word did you hear?</h2>

                <div className="game-options">
                  {['a', 'b'].map((opt) => {
                    const word = opt === 'a' ? q.option_a : q.option_b;
                    const isSelected = selected === opt;
                    let cls = 'default';
                    if (isSelected) cls = result === 'correct' ? 'correct' : 'wrong';
                    return (
                      <button
                        key={opt}
                        className={`game-option ${cls}`}
                        onClick={() => handleAnswer(opt)}
                        disabled={!!selected}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`game-result-banner ${result}`}
                    >
                      {result === 'correct' ? (
                        <span>
                          <CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Correct!
                        </span>
                      ) : (
                        <span>
                          <XCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Wrong! The correct answer was "{q.correct === 'a' ? q.option_a : q.option_b}"
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="game-footer">
            <div className="game-timer">
              <Clock size={16} /> Time: <strong>{elapsed}s</strong>
            </div>
            <button className="game-skip-btn" onClick={skipQuestion}>
              Skip <SkipForward size={16} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}