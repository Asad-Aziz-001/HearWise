import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Volume2, CheckCircle, XCircle, Home, RotateCcw,
  Link as LinkIcon, Pause, Play
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

export default function WordChainMemory() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('loading');
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(null);
  const [playingChain, setPlayingChain] = useState(false);
  const [playingIdx, setPlayingIdx] = useState(null);
  const [playingDone, setPlayingDone] = useState(false);
  const [audioEl, setAudioEl] = useState(null);

  // Load game
  useEffect(() => {
    api.post('/games/generate/word_chain_memory', {
      difficulty: 'easy',
      question_count: 6,
    })
      .then(({ data }) => {
        console.log('🔗 Chain game:', data);
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

  // Play entire chain
  const playChain = () => {
    if (!q || playingChain) return;
    setPlayingChain(true);
    setPlayingDone(false);
    let i = 0;

    const playNext = () => {
      if (i >= q.audios.length) {
        setPlayingChain(false);
        setPlayingIdx(null);
        setPlayingDone(true);
        return;
      }
      setPlayingIdx(i);
      const audio = new Audio(`http://localhost:5000/static/audio/${q.audios[i]}`);
      audioEl && audioEl.pause();
      setAudioEl(audio);
      audio.play().catch(() => toast.error('Audio failed'));
      audio.onended = () => {
        i++;
        setTimeout(playNext, 600);
      };
    };
    playNext();
  };

  // Stop playback
  const stopChain = () => {
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
    }
    setPlayingChain(false);
    setPlayingIdx(null);
  };

  // Handle answer
  const handleAnswer = (idx) => {
    if (answers[String(q.question_id)] !== undefined) return;
    const qid = String(q.question_id);
    setAnswers(prev => ({ ...prev, [qid]: idx }));
    
    setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex(index + 1);
        setPlayingDone(false);
        setPlayingIdx(null);
      } else {
        finishGame({ ...answers, [qid]: idx });
      }
    }, 1200);
  };

  // Finish game
  const finishGame = async (allAnswers) => {
    try {
      const { data } = await api.post(`/games/auto-test/${session}`, {
        game_type: 'word_chain_memory',
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
              <p>Generating word chains...</p>
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
                {completed.accuracy >= 70 ? '🔗' : '🧠'}
              </div>
              <h2 className="game-complete-title">Chain Memory Complete!</h2>
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
                  if (!qData) return null;
                  return (
                    <div key={i} style={{
                      padding: 12,
                      marginBottom: 6,
                      borderRadius: 10,
                      background: r.is_correct ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${r.is_correct ? '#d1fae5' : '#fecaca'}`,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}>
                        {r.is_correct ? (
                          <CheckCircle size={18} color="#10b981" />
                        ) : (
                          <XCircle size={18} color="#ef4444" />
                        )}
                        <div style={{ flex: 1, fontSize: 13 }}>
                          <div style={{ fontWeight: 600, color: '#102a56' }}>
                            {qData.chain.join(' → ')}
                          </div>
                          <div style={{ fontSize: 11, color: '#5a6b8c', marginTop: 2 }}>
                            Last word: <strong>{qData.chain[qData.chain.length - 1]}</strong>
                          </div>
                        </div>
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
  const chainLength = q?.chain?.length || 0;

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
              background: '#f5f3ff',
              color: '#7c3aed',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 24,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <LinkIcon size={12} /> Remember the last word in the chain
            </div>

            {/* Play button */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              {!playingChain ? (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={playChain}
                  disabled={answered !== undefined}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: answered !== undefined
                      ? '#9ca3af'
                      : 'linear-gradient(135deg, #a855f7, #7c3aed)',
                    color: 'white',
                    border: 'none',
                    cursor: answered !== undefined ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    boxShadow: '0 12px 30px rgba(168, 85, 247, 0.35)',
                  }}
                >
                  <Play size={40} style={{ marginLeft: 4 }} />
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={stopChain}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    boxShadow: '0 0 0 20px rgba(239, 68, 68, 0.15), 0 12px 30px rgba(239, 68, 68, 0.4)',
                  }}
                >
                  <Pause size={40} />
                </motion.button>
              )}
              <p style={{
                fontSize: 13,
                color: '#5a6b8c',
                marginTop: 12,
                fontWeight: 600,
              }}>
                {playingChain ? '🔊 Playing chain...' : playingDone ? '✅ Tap to replay or answer below' : `Tap to hear ${chainLength} words`}
              </p>
            </div>

            {/* Chain visualizer */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 6,
              marginBottom: 24,
              flexWrap: 'wrap',
            }}>
              {q.chain.map((_, i) => {
                const isPlaying = playingIdx === i;
                const isDone = playingIdx !== null && i < playingIdx;
                const isRevealed = answered !== undefined;
                
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <motion.div
                      animate={{
                        scale: isPlaying ? 1.15 : 1,
                        backgroundColor: isPlaying
                          ? '#a855f7'
                          : isRevealed
                          ? '#d1fae5'
                          : isDone
                          ? '#e8f0fe'
                          : '#f3f4f6',
                      }}
                      transition={{ duration: 0.2 }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 18,
                        color: isPlaying
                          ? 'white'
                          : isRevealed
                          ? '#059669'
                          : '#5a6b8c',
                        fontFamily: 'Manrope',
                        boxShadow: isPlaying
                          ? '0 6px 20px rgba(168, 85, 247, 0.4)'
                          : 'none',
                      }}
                    >
                      {isRevealed ? q.chain[i] : i + 1}
                    </motion.div>
                    {i < q.chain.length - 1 && (
                      <div style={{
                        color: '#cbd5e1',
                        fontSize: 16,
                        fontWeight: 700,
                      }}>
                        →
                      </div>
                    )}
                  </div>
                );
              })}
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
              What was the LAST word?
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
                      Correct! Chain was: {q.chain.join(' → ')}
                    </>
                  ) : (
                    <>
                      <XCircle size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                      Wrong! Chain was: {q.chain.join(' → ')}
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