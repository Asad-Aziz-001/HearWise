import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Volume2, Mic, CheckCircle, XCircle, Home, RotateCcw, Loader, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

export default function PronunciationScoring() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('loading');
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentScore, setCurrentScore] = useState(null);
  const recognitionRef = useRef(null);

  // Load game
  useEffect(() => {
    api.post('/games/generate/pronunciation', {
      difficulty: 'easy',
      question_count: 5,
    })
      .then(({ data }) => {
        console.log('🎤 Pronunciation game:', data);
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

  // Play target word
  const playAudio = () => {
    if (!q?.audio) return;
    setPlaying(true);
    const audio = new Audio(`http://localhost:5000/static/audio/${q.audio}`);
    audio.play().catch(() => toast.error('Audio failed'));
    audio.onended = () => setPlaying(false);
  };

  // Start mic
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported. Use Chrome/Edge.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setTranscript('');
      setCurrentScore(null);
    };

    recognition.onresult = (event) => {
      const spoken = event.results[0][0].transcript.trim().toLowerCase();
      setTranscript(spoken);
      checkScore(spoken);
    };

    recognition.onerror = (event) => {
      setListening(false);
      toast.error(`Mic error: ${event.error}`);
    };

    recognition.onend = () => setListening(false);

    recognition.start();
    recognitionRef.current = recognition;
  };

  // Calculate score (client-side, matches backend logic)
  const checkScore = (spoken) => {
    const expected = q.word.toLowerCase();
    const similarity = levenshteinSimilarity(spoken, expected);
    const score = Math.round(similarity * 100);
    setCurrentScore(score);

    // Save answer
    const qid = String(q.question_id);
    setAnswers(prev => ({ ...prev, [qid]: spoken }));
  };

  // Levenshtein similarity (0-1)
  const levenshteinSimilarity = (a, b) => {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    const distance = matrix[b.length][a.length];
    return 1 - distance / Math.max(a.length, b.length);
  };

  // Next question
  const nextQuestion = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setTranscript('');
      setCurrentScore(null);
    } else {
      finishGame();
    }
  };

  // Finish game
  const finishGame = async () => {
    try {
      const { data } = await api.post(`/games/auto-test/${session}`, {
        game_type: 'pronunciation',
        questions,
        user_answers: answers,
      });
      console.log('📊 Final result:', data);
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
              <p>Generating pronunciation challenge...</p>
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
                {completed.accuracy >= 70 ? '🎤' : '🎙️'}
              </div>
              <h2 className="game-complete-title">Pronunciation Complete!</h2>
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
                  <div style={{ fontSize: 12, color: '#5a6b8c' }}>Overall Accuracy</div>
                </div>
                <div style={{ padding: 20, background: '#f5f8ff', borderRadius: 12 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>
                    {completed.correct}/{completed.total}
                  </div>
                  <div style={{ fontSize: 12, color: '#5a6b8c' }}>Correct</div>
                </div>
              </div>

              {/* Per-word breakdown */}
              {completed.results && (
                <div style={{
                  maxWidth: 500,
                  margin: '0 auto 24px',
                  maxHeight: 300,
                  overflowY: 'auto',
                }}>
                  {completed.results.map((r, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: 10,
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
                          Word: "{r.expected}"
                        </div>
                        {r.spoken && (
                          <div style={{ fontSize: 11, color: '#5a6b8c', marginTop: 2 }}>
                            You said: "{r.spoken}"
                          </div>
                        )}
                      </div>
                      <div style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: r.score >= 70 ? '#10b981' : '#ef4444',
                      }}>
                        {r.score}%
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
                <div className="game-progress-fill" style={{ width: `${progress}%` }} />
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
              marginBottom: 20,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <Sparkles size={12} /> Speak the word clearly
            </div>

            {/* Target word display */}
            <div style={{
              padding: '24px 48px',
              background: 'linear-gradient(135deg, #eff6ff, #e0e7ff)',
              borderRadius: 20,
              marginBottom: 24,
              border: '2px solid #c7d2fe',
            }}>
              <p style={{
                fontSize: 12,
                color: '#5a6b8c',
                marginBottom: 8,
                textAlign: 'center',
                fontWeight: 600,
              }}>
                🎯 TARGET WORD
              </p>
              <h2 style={{
                fontFamily: 'Manrope',
                fontSize: '3rem',
                fontWeight: 800,
                color: '#1e6ef5',
                margin: 0,
                textAlign: 'center',
                letterSpacing: 2,
              }}>
                {q.word}
              </h2>
            </div>

            {/* Play button */}
            <button
              onClick={playAudio}
              disabled={playing}
              style={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: playing ? '#9ca3af' : 'linear-gradient(135deg, #1e6ef5, #1554c9)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 6px 20px rgba(30, 110, 245, 0.3)',
              }}
            >
              <Volume2 size={28} />
            </button>
            <p style={{
              fontSize: 12,
              color: '#5a6b8c',
              marginBottom: 24,
              textAlign: 'center',
            }}>
              {playing ? 'Playing...' : 'Listen to correct pronunciation'}
            </p>

            {/* Mic button */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={startListening}
                disabled={listening}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: listening
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #a855f7, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  cursor: listening ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  boxShadow: listening
                    ? '0 0 0 20px rgba(239, 68, 68, 0.15), 0 12px 30px rgba(239, 68, 68, 0.4)'
                    : '0 12px 30px rgba(168, 85, 247, 0.35)',
                  transition: 'all 0.3s',
                }}
              >
                {listening ? (
                  <Loader size={40} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Mic size={40} />
                )}
              </motion.button>
              <p style={{
                fontSize: 13,
                color: '#5a6b8c',
                marginTop: 12,
                fontWeight: 600,
              }}>
                {listening ? '🎤 Listening... speak now' : 'Tap to speak'}
              </p>
            </div>

            {/* Transcript + score */}
            <AnimatePresence>
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    maxWidth: 500,
                    margin: '0 auto 20px',
                    padding: 20,
                    borderRadius: 16,
                    background: currentScore >= 70 ? '#f0fdf4' : '#fef2f2',
                    border: `2px solid ${currentScore >= 70 ? '#10b981' : '#ef4444'}`,
                    textAlign: 'center',
                  }}
                >
                  <p style={{
                    fontSize: 13,
                    color: '#5a6b8c',
                    marginBottom: 8,
                  }}>
                    You said:
                  </p>
                  <p style={{
                    fontFamily: 'Manrope',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: currentScore >= 70 ? '#10b981' : '#ef4444',
                    marginBottom: 12,
                  }}>
                    "{transcript}"
                  </p>

                  {/* Circular score */}
                  <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
                    <svg width="120" height="120" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke={currentScore >= 70 ? '#10b981' : '#ef4444'}
                        strokeWidth="8"
                        strokeDasharray={`${(currentScore / 100) * 314} 314`}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                        style={{ transition: 'stroke-dasharray 0.8s ease' }}
                      />
                    </svg>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: currentScore >= 70 ? '#10b981' : '#ef4444',
                      }}>
                        {currentScore}%
                      </div>
                      <div style={{ fontSize: 10, color: '#5a6b8c' }}>Score</div>
                    </div>
                  </div>

                  <p style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: currentScore >= 70 ? '#10b981' : '#ef4444',
                    marginTop: 12,
                  }}>
                    {currentScore >= 90 ? '🌟 Perfect!' :
                     currentScore >= 70 ? '✅ Good!' :
                     currentScore >= 50 ? '👍 Close!' : '❌ Try again'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Next button */}
            {currentScore !== null && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={nextQuestion}
                style={{
                  display: 'block',
                  margin: '0 auto',
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(168, 85, 247, 0.35)',
                }}
              >
                {index + 1 < questions.length ? 'Next Word →' : 'Finish →'}
              </motion.button>
            )}
          </div>

          {/* Footer */}
          <div className="game-footer">
            <div className="game-timer">
              Word {index + 1} of {questions.length}
            </div>
          </div>
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}