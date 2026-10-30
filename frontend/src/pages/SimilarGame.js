import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Volume2, Clock, Home, RotateCcw,
  CheckCircle, XCircle, Loader, Gauge, Pause
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5];

export default function SimilarGame() {
  const navigate = useNavigate();

  const [stage, setStage] = useState('loading');
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [audioEl, setAudioEl] = useState(null);

  // Load AI-generated game on mount
  useEffect(() => {
    api.post('/games/generate/similar', {
      difficulty: 'easy',
      question_count: 10,
    })
      .then(({ data }) => {
        console.log('🎮 Similar game:', data);
        setSession(data.session_id);
        setQuestions(data.questions);
        setStage('playing');
      })
      .catch((err) => {
        console.error(err);
        toast.error('Could not generate game');
        setStage('complete');
      });
  }, []);

  // ================= AUDIO =================
  const playAudio = (path) => {
    if (!path) return toast.error('Audio not available');

    // Stop any existing audio
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
    }

    setAudioPlaying(true);
    const audio = new Audio(`http://localhost:5000/static/audio/${path}`);
    audio.playbackRate = playbackSpeed;
    audio.play().catch(() => toast.error('Audio failed'));
    audio.onended = () => setAudioPlaying(false);
    setAudioEl(audio);
  };

  const stopAudio = () => {
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
      setAudioPlaying(false);
    }
  };

  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (audioEl && !audioEl.paused) {
      audioEl.playbackRate = speed;
    }
  };

  // ================= ANSWER =================
  const handleAnswer = (choice) => {
    const qid = String(questions[index].question_id);
    if (answers[qid]) return;

    setAnswers(prev => ({ ...prev, [qid]: choice }));
    console.log(`✅ Q${qid}: Selected "${choice}" | Correct: "${questions[index].correct}"`);

    setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex(index + 1);
        stopAudio();
      } else {
        finishGame();
      }
    }, 700);
  };

  const finishGame = async () => {
    try {
      const { data } = await api.post(`/games/auto-test/${session}`, {
        game_type: 'similar',
        questions,
        user_answers: answers,
      });
      console.log('📥 AI Result:', data);
      setCompleted(data);
      setStage('complete');
    } catch (err) {
      console.error(err);
      toast.error('Could not complete game');
      navigate('/dashboard');
    }
  };

  const q = questions[index];

  // ============ LOADING ============
  if (stage === 'loading') {
    return (
      <div className="game-page">
        <Sidebar />
        <main className="game-main">
          <div className="game-card">
            <div className="game-loading">
              <div className="game-loading-spinner" />
              <p>AI is preparing your similar-sounding words game...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ============ COMPLETE ============
  if (stage === 'complete' && completed) {
    return (
      <div className="game-page">
        <Sidebar />
        <main className="game-main">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="game-card"
          >
            <div className="game-complete">
              <div className="game-complete-icon">
                {completed.accuracy >= 70 ? '🎉' : completed.accuracy >= 50 ? '👍' : '💪'}
              </div>
              <h2 className="game-complete-title">Game Complete!</h2>
              <p className="game-complete-sub">{completed.ai_feedback}</p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
                maxWidth: 500,
                margin: '0 auto 32px',
              }}>
                <div style={{
                  padding: 20,
                  background: completed.accuracy >= 70 ? '#d1fae5' : completed.accuracy >= 50 ? '#fef3c7' : '#fee2e2',
                  borderRadius: 12,
                }}>
                  <div style={{
                    fontSize: 28, fontWeight: 800,
                    color: completed.accuracy >= 70 ? '#059669' : completed.accuracy >= 50 ? '#d97706' : '#dc2626',
                  }}>
                    {completed.accuracy}%
                  </div>
                  <div style={{ fontSize: 12, color: '#5a6b8c', marginTop: 4 }}>Accuracy</div>
                </div>
                <div style={{ padding: 20, background: '#f5f8ff', borderRadius: 12 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>
                    {completed.correct}/{completed.total}
                  </div>
                  <div style={{ fontSize: 12, color: '#5a6b8c', marginTop: 4 }}>Correct</div>
                </div>
                <div style={{ padding: 20, background: '#f5f8ff', borderRadius: 12 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#a855f7' }}>
                    {completed.total}
                  </div>
                  <div style={{ fontSize: 12, color: '#5a6b8c', marginTop: 4 }}>Questions</div>
                </div>
              </div>

              {/* Per-question breakdown */}
              {completed.results && completed.results.length > 0 && (
                <div style={{
                  maxWidth: 500,
                  margin: '0 auto 24px',
                  maxHeight: 280,
                  overflowY: 'auto',
                  padding: 12,
                  background: '#f8faff',
                  borderRadius: 12,
                }}>
                  {completed.results.map((r, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: 8,
                      borderBottom: i < completed.results.length - 1 ? '1px solid #e8f0fe' : 'none',
                      fontSize: 13,
                    }}>
                      {r.is_correct
                        ? <CheckCircle size={16} color="#10b981" />
                        : <XCircle size={16} color="#ef4444" />}
                      <span style={{ color: '#102a56', fontWeight: 600 }}>Q{r.question_id}</span>
                      <span style={{ color: '#5a6b8c', flex: 1 }}>{r.sound_contrast}</span>
                      <span style={{
                        color: r.is_correct ? '#10b981' : '#ef4444',
                        fontWeight: 700,
                        fontSize: 12,
                      }}>
                        {r.is_correct ? 'Correct' : `Ans: ${String(r.correct_answer).toUpperCase()}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="game-complete-actions">
                <Link to="/dashboard" className="game-btn-secondary">
                  <Home size={16} /> Back to Dashboard
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="game-btn-primary"
                >
                  <RotateCcw size={16} /> Play Again
                </button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // ============ PLAYING ============
  const progress = ((index + 1) / questions.length) * 100;
  const answered = q ? answers[String(q.question_id)] : null;

  return (
    <div className="game-page">
      <Sidebar />
      <main className="game-main">
        <div className="game-card">
          {/* Header */}
          <div className="game-header">
            <button className="game-back" onClick={() => navigate('/games')}>
              <ArrowLeft size={16} /> Back
            </button>
            <div className="game-progress-wrap">
              <span className="game-progress-counter">
                {index + 1} / {questions.length}
              </span>
              <div className="game-progress-bar">
                <div className="game-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="game-body">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                {/* Contrast badge */}
                <div style={{
                  padding: '6px 14px',
                  background: '#f5f3ff',
                  color: '#7c3aed',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 20,
                }}>
                  🎯 {q.sound_contrast}
                </div>

                {/* Audio Button */}
                <button
                  className={`game-audio-btn ${audioPlaying ? 'playing' : ''}`}
                  onClick={() => audioPlaying ? stopAudio() : playAudio(q.play_audio)}
                  style={{
                    background: audioPlaying
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'linear-gradient(135deg, #1e6ef5, #1554c9)',
                  }}
                >
                  {audioPlaying ? <Pause size={36} /> : <Volume2 size={36} />}
                </button>
                <p style={{ fontSize: 13, color: '#5a6b8c', marginTop: 16, marginBottom: 8 }}>
                  {audioPlaying ? '🔊 Playing... (tap to stop)' : 'Tap to hear the word'}
                </p>

                {/* Speed Controls */}
                <div style={{
                  display: 'flex',
                  gap: 6,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 24,
                  padding: '6px 10px',
                  background: '#f8faff',
                  borderRadius: 10,
                  border: '1px solid #e8f0fe',
                }}>
                  <Gauge size={14} color="#5a6b8c" style={{ marginRight: 4 }} />
                  <span style={{ fontSize: 11, color: '#5a6b8c', fontWeight: 600, marginRight: 6 }}>
                    Speed:
                  </span>
                  {SPEED_OPTIONS.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => changeSpeed(speed)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 6,
                        border: 'none',
                        background: playbackSpeed === speed ? '#1e6ef5' : 'white',
                        color: playbackSpeed === speed ? 'white' : '#5a6b8c',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: playbackSpeed === speed ? '0 2px 8px rgba(30,110,245,0.3)' : 'none',
                      }}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

                <h2 className="game-question">Which word did you hear?</h2>

                {/* Options */}
                <div className="game-options">
                  {['a', 'b'].map((opt) => {
                    const word = opt === 'a' ? q.option_a : q.option_b;
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
                        {word}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="game-footer">
            <div className="game-timer">
              <Clock size={16} /> Question {index + 1} of {questions.length}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}