import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Volume2, CheckCircle, XCircle, Home, RotateCcw,
  Sparkles, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

export default function PhonemeReplacement() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('loading');
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(null);
  const [playing, setPlaying] = useState(null);

  // Load game
  useEffect(() => {
    api.post('/games/generate/phoneme_replacement', {
      difficulty: 'easy',
      question_count: 6,
    })
      .then(({ data }) => {
        console.log('🔤 Phoneme game:', data);
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
  const playAudio = (path, label) => {
    if (!path) return toast.error('Audio not available');
    setPlaying(label);
    const audio = new Audio(`http://localhost:5000/static/audio/${path}`);
    audio.play().catch(() => toast.error('Audio failed'));
    audio.onended = () => setPlaying(null);
  };

  // Handle answer
  const handleAnswer = (choice) => {
    if (answers[String(q.question_id)] !== undefined) return;
    const qid = String(q.question_id);
    setAnswers(prev => ({ ...prev, [qid]: choice }));
    
    setTimeout(() => {
      if (index + 1 < questions.length) setIndex(index + 1);
      else finishGame({ ...answers, [qid]: choice });
    }, 1000);
  };

  // Finish game
  const finishGame = async (allAnswers) => {
    try {
      const { data } = await api.post(`/games/auto-test/${session}`, {
        game_type: 'phoneme_replacement',
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
              <p>Loading phoneme challenge...</p>
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
                {completed.accuracy >= 70 ? '🔤' : '🎯'}
              </div>
              <h2 className="game-complete-title">Phoneme Test Complete!</h2>
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

              {/* Per-question breakdown */}
              <div style={{
                maxWidth: 500,
                margin: '0 auto 24px',
                maxHeight: 300,
                overflowY: 'auto',
              }}>
                {completed.results.map((r, i) => {
                  const qData = questions.find(x => x.question_id === r.question_id);
                  return (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: 12,
                      marginBottom: 6,
                      borderRadius: 10,
                      background: r.is_correct ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${r.is_correct ? '#d1fae5' : '#fecaca'}`,
                    }}>
                      {r.is_correct ? (
                        <CheckCircle size={18} color="#10b981" />
                      ) : (
                        <XCircle size={18} color="#ef4444" />
                      )}
                      <div style={{ flex: 1, fontSize: 13 }}>
                        <div style={{ fontWeight: 600, color: '#102a56' }}>
                          {qData?.original} {qData?.change} {qData?.options[qData?.correct]}
                        </div>
                        {!r.is_correct && (
                          <div style={{ fontSize: 11, color: '#5a6b8c', marginTop: 2 }}>
                            You chose: {qData?.options[r.user_answer]}
                          </div>
                        )}
                      </div>
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
              <Sparkles size={12} /> What happens when one sound changes?
            </div>

            {/* Before/After transformation */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              marginBottom: 32,
              flexWrap: 'wrap',
            }}>
              {/* Original word */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  padding: '16px 28px',
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                  borderRadius: 16,
                  border: '2px solid #93c5fd',
                  marginBottom: 10,
                }}>
                  <div style={{
                    fontSize: 10,
                    color: '#1e6ef5',
                    fontWeight: 700,
                    marginBottom: 4,
                    letterSpacing: 1,
                  }}>
                    ORIGINAL
                  </div>
                  <div style={{
                    fontFamily: 'Manrope',
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: '#1e6ef5',
                    letterSpacing: 1,
                  }}>
                    {q.original}
                  </div>
                </div>
                <button
                  onClick={() => playAudio(q.original_audio, 'original')}
                  disabled={answered !== undefined}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: playing === 'original' ? '#ef4444' : '#1e6ef5',
                    color: 'white',
                    border: 'none',
                    cursor: answered !== undefined ? 'default' : 'pointer',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Volume2 size={12} />
                  {playing === 'original' ? 'Playing...' : 'Listen'}
                </button>
              </div>

              {/* Change rule arrow */}
              <div style={{
                textAlign: 'center',
                padding: '0 12px',
              }}>
                <div style={{
                  fontSize: 18,
                  color: '#a855f7',
                  fontWeight: 800,
                  marginBottom: 4,
                  fontFamily: 'monospace',
                }}>
                  {q.change}
                </div>
                <ArrowRight size={28} color="#a855f7" />
              </div>

              {/* Mystery new word */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  padding: '16px 28px',
                  background: answered !== undefined
                    ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)'
                    : 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                  borderRadius: 16,
                  border: `2px solid ${answered !== undefined ? '#86efac' : '#c4b5fd'}`,
                  marginBottom: 10,
                }}>
                  <div style={{
                    fontSize: 10,
                    color: answered !== undefined ? '#059669' : '#7c3aed',
                    fontWeight: 700,
                    marginBottom: 4,
                    letterSpacing: 1,
                  }}>
                    NEW WORD
                  </div>
                  <div style={{
                    fontFamily: 'Manrope',
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: answered !== undefined ? '#059669' : '#7c3aed',
                    letterSpacing: 1,
                  }}>
                    {answered !== undefined ? q.options[q.correct] : '?'}
                  </div>
                </div>
                {answered !== undefined && (
                  <button
                    onClick={() => playAudio(q.new_audio, 'new')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      background: playing === 'new' ? '#ef4444' : '#10b981',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Volume2 size={12} />
                    {playing === 'new' ? 'Playing...' : 'Listen'}
                  </button>
                )}
              </div>
            </div>

            {/* Question */}
            <h2 style={{
              fontFamily: 'Manrope',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: '#102a56',
              textAlign: 'center',
              marginBottom: 20,
            }}>
              What is the new word?
            </h2>

            {/* Options */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
              maxWidth: 500,
              margin: '0 auto',
            }}>
              {q.options.map((word, idx) => {
                const isSelected = answered === idx;
                const isCorrect = idx === q.correct;

                let bg = 'white';
                let borderColor = '#e8f0fe';
                let color = '#102a56';
                let icon = null;

                if (answered !== undefined) {
                  if (isCorrect) {
                    bg = '#f0fdf4';
                    borderColor = '#10b981';
                    color = '#059669';
                    icon = <CheckCircle size={20} color="#10b981" />;
                  } else if (isSelected) {
                    bg = '#fef2f2';
                    borderColor = '#ef4444';
                    color = '#dc2626';
                    icon = <XCircle size={20} color="#ef4444" />;
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={answered !== undefined}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: bg,
                      border: `2px solid ${borderColor}`,
                      fontSize: 18,
                      fontWeight: 700,
                      color,
                      cursor: answered !== undefined ? 'default' : 'pointer',
                      fontFamily: 'Manrope',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {word}
                    {icon}
                  </button>
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
                      Correct! {q.original} {q.change} {q.options[q.correct]}
                    </>
                  ) : (
                    <>
                      <XCircle size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                      Wrong! {q.original} {q.change} {q.options[q.correct]}
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