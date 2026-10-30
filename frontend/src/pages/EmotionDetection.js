import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Volume2, CheckCircle, XCircle, Home, RotateCcw,
  Smile, Frown, Angry, Meh
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

const EMOTION_CONFIG = {
  happy: {
    emoji: '😊',
    label: 'Happy',
    color: '#10b981',
    bg: '#f0fdf4',
    border: '#10b981',
    Icon: Smile,
  },
  sad: {
    emoji: '😢',
    label: 'Sad',
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#3b82f6',
    Icon: Frown,
  },
  angry: {
    emoji: '😡',
    label: 'Angry',
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#ef4444',
    Icon: Angry,
  },
  neutral: {
    emoji: '😐',
    label: 'Neutral',
    color: '#6b7280',
    bg: '#f9fafb',
    border: '#6b7280',
    Icon: Meh,
  },
};

export default function EmotionDetection() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('loading');
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [revealedText, setRevealedText] = useState(false);

  // Load game
  useEffect(() => {
    api.post('/games/generate/emotion_detection', {
      difficulty: 'easy',
      question_count: 5,
    })
      .then(({ data }) => {
        console.log('😊 Emotion game:', data);
        if (!data.questions || data.questions.length === 0) {
          toast.error('No questions generated');
          setStage('complete');
          return;
        }
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

  const q = questions[index];

  // Play audio
  const playAudio = () => {
    if (!q?.audio) return toast.error('Audio not available');
    setPlaying(true);
    const audio = new Audio(`http://localhost:5000/static/audio/${q.audio}`);
    audio.play().catch(() => toast.error('Audio failed'));
    audio.onended = () => setPlaying(false);
  };

  // Handle answer
  const handleAnswer = (choice) => {
    if (answers[String(q.question_id)] !== undefined) return;
    const qid = String(q.question_id);
    setAnswers(prev => ({ ...prev, [qid]: choice }));
    setRevealedText(true);
    
    setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex(index + 1);
        setRevealedText(false);
      } else {
        finishGame({ ...answers, [qid]: choice });
      }
    }, 1500);
  };

  // Finish game
  const finishGame = async (allAnswers) => {
    try {
      const { data } = await api.post(`/games/auto-test/${session}`, {
        game_type: 'emotion_detection',
        questions,
        user_answers: allAnswers || answers,
      });
      console.log('📊 Result:', data);
      setCompleted(data);
      setStage('complete');
    } catch (err) {
      console.error(err);
      toast.error('Could not complete');
      navigate('/games');
    }
  };

  // ============ LOADING ============
  if (stage === 'loading') {
    return (
      <div className="game-page">
        <Sidebar />
        <main className="game-main">
          <div className="game-card">
            <div className="game-loading">
              <div className="game-loading-spinner" />
              <p>Generating emotional sentences...</p>
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
                {completed.accuracy >= 70 ? '😊' : '🎭'}
              </div>
              <h2 className="game-complete-title">Emotion Detection Complete!</h2>
              <p className="game-complete-sub">{completed.ai_feedback}</p>

              {/* Score cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 16,
                maxWidth: 400,
                margin: '0 auto 24px',
              }}>
                <div style={{ padding: 20, background: '#f5f8ff', borderRadius: 12 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#1e6ef5' }}>
                    {completed.accuracy}%
                  </div>
                  <div style={{ fontSize: 12, color: '#5a6b8c' }}>Accuracy</div>
                </div>
                <div style={{ padding: 20, background: '#f5f8ff', borderRadius: 12 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>
                    {completed.correct}/{completed.total}
                  </div>
                  <div style={{ fontSize: 12, color: '#5a6b8c' }}>Correct</div>
                </div>
              </div>

              {/* Per-emotion breakdown */}
              <div style={{
                maxWidth: 500,
                margin: '0 auto 24px',
                maxHeight: 300,
                overflowY: 'auto',
              }}>
                {completed.results.map((r, i) => {
                  const qData = questions.find(x => x.question_id === r.question_id);
                  if (!qData) return null;
                  
                  const config = EMOTION_CONFIG[qData.emotion];
                  
                  return (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      marginBottom: 6,
                      borderRadius: 10,
                      background: r.is_correct ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${r.is_correct ? '#d1fae5' : '#fecaca'}`,
                    }}>
                      <div style={{ fontSize: 24 }}>
                        {config.emoji}
                      </div>
                      <div style={{ flex: 1, fontSize: 13 }}>
                        <div style={{ fontWeight: 600, color: '#102a56', marginBottom: 2 }}>
                          "{qData.text}"
                        </div>
                        <div style={{ fontSize: 11, color: '#5a6b8c' }}>
                          Emotion: <strong style={{ color: config.color }}>{config.label}</strong>
                          {!r.is_correct && (
                            <> · You picked: {EMOTION_CONFIG[qData.options[r.user_answer]]?.label || '?'}</>
                          )}
                        </div>
                      </div>
                      {r.is_correct ? (
                        <CheckCircle size={18} color="#10b981" />
                      ) : (
                        <XCircle size={18} color="#ef4444" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="game-complete-actions">
                <Link to="/games" className="game-btn-secondary">
                  <Home size={16} /> Games Menu
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
  const answered = q ? answers[String(q.question_id)] : undefined;
  const progress = ((index + 1) / questions.length) * 100;
  const correctConfig = q ? EMOTION_CONFIG[q.emotion] : null;

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
                <div
                  className="game-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="game-body">
            {/* Badge */}
            <div style={{
              padding: '4px 14px',
              background: '#fef3c7',
              color: '#b45309',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 24,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}>
              🎭 Listen carefully — what emotion do you hear?
            </div>

            {/* Audio Player */}
            <div style={{
              padding: 32,
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              borderRadius: 24,
              marginBottom: 24,
              textAlign: 'center',
            }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={playAudio}
                disabled={playing}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: playing
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white',
                  border: 'none',
                  cursor: playing ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: playing
                    ? '0 0 0 20px rgba(239, 68, 68, 0.15), 0 12px 30px rgba(239, 68, 68, 0.4)'
                    : '0 12px 30px rgba(245, 158, 11, 0.35)',
                  transition: 'all 0.3s',
                }}
              >
                <Volume2 size={48} />
              </motion.button>
              <p style={{
                fontSize: 14,
                color: '#92400e',
                fontWeight: 600,
                marginBottom: 8,
              }}>
                {playing ? '🔊 Playing emotional audio...' : 'Tap to hear the emotion'}
              </p>

              {/* Reveal text after answering */}
              <AnimatePresence>
                {revealedText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginTop: 16,
                      padding: 12,
                      background: 'rgba(255,255,255,0.9)',
                      borderRadius: 12,
                      fontSize: 14,
                      color: '#102a56',
                      fontStyle: 'italic',
                    }}
                  >
                    "{q.text}"
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Question */}
            <h2 style={{
              fontFamily: 'Manrope',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: '#102a56',
              textAlign: 'center',
              marginBottom: 24,
            }}>
              What emotion did you hear?
            </h2>

            {/* Emotion buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
              maxWidth: 500,
              margin: '0 auto',
            }}>
              {q.options.map((emotion, idx) => {
                const config = EMOTION_CONFIG[emotion];
                const isSelected = answered === idx;
                const isCorrect = idx === q.correct;

                let bg = 'white';
                let borderColor = '#e8f0fe';
                let opacity = 1;
                let icon = null;

                if (answered !== undefined) {
                  if (isCorrect) {
                    bg = config.bg;
                    borderColor = config.color;
                    icon = <CheckCircle size={18} color={config.color} />;
                  } else if (isSelected) {
                    bg = '#fef2f2';
                    borderColor = '#ef4444';
                    icon = <XCircle size={18} color="#ef4444" />;
                  } else {
                    opacity = 0.4;
                  }
                }

                return (
                  <motion.button
                    key={idx}
                    whileHover={{ y: answered === undefined ? -3 : 0 }}
                    whileTap={{ scale: answered === undefined ? 0.97 : 1 }}
                    onClick={() => handleAnswer(idx)}
                    disabled={answered !== undefined}
                    style={{
                      padding: 20,
                      borderRadius: 16,
                      background: bg,
                      border: `2px solid ${borderColor}`,
                      cursor: answered !== undefined ? 'default' : 'pointer',
                      opacity,
                      transition: 'all 0.2s',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 48 }}>{config.emoji}</span>
                    <span style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: config.color,
                      fontFamily: 'Manrope',
                    }}>
                      {config.label}
                    </span>
                    {icon}
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {answered !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    marginTop: 24,
                    padding: 16,
                    borderRadius: 12,
                    textAlign: 'center',
                    background: answered === q.correct ? '#f0fdf4' : '#fef2f2',
                    color: answered === q.correct ? '#059669' : '#dc2626',
                    fontWeight: 600,
                    fontSize: 14,
                    maxWidth: 500,
                    margin: '24px auto 0',
                  }}
                >
                  {answered === q.correct ? (
                    <>
                      <CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                      Correct! The emotion was <strong>{correctConfig.emoji} {correctConfig.label}</strong>
                    </>
                  ) : (
                    <>
                      <XCircle size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                      Wrong! The emotion was <strong>{correctConfig.emoji} {correctConfig.label}</strong>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="game-footer">
            <div className="game-timer">
              Question {index + 1} of {questions.length}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}