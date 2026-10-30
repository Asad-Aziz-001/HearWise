import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Volume2, CheckCircle, XCircle, Loader, Eye, EyeOff,
  ArrowLeft, Home, RotateCcw, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

export default function SpeechPractice() {
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [game, setGame] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [currentScore, setCurrentScore] = useState(null);
  const recognitionRef = useRef(null);

  // Load AI game
  useEffect(() => {
    api.post('/games/generate/similar', {
      difficulty: 'easy',
      question_count: 5,
    })
      .then(({ data }) => {
        console.log('🎤 Speech game loaded:', data);
        if (!data.questions || data.questions.length === 0) {
          toast.error('No questions generated');
          setLoading(false);
          return;
        }
        setGame(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ Game load error:', err);
        toast.error('Could not load game');
        setLoading(false);
      });
  }, []);

  const playAudio = (path) => {
    if (!path) return toast.error('Audio not available');
    setPlaying(true);
    const audio = new Audio(`http://localhost:5000/static/audio/${path}`);
    audio.play().catch(() => toast.error('Audio failed'));
    audio.onended = () => setPlaying(false);
  };

  const startListening = async () => {
    // ✅ Step 1: Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported. Use Chrome or Edge.', { duration: 5000 });
      return;
    }

    // ✅ Step 2: Check mic permission FIRST
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());  // Release immediately
      console.log('✅ Mic permission granted');
    } catch (err) {
      console.error('❌ Mic permission denied:', err);
      toast.error(
        err.name === 'NotAllowedError'
          ? 'Please allow microphone access (click 🔒 in URL bar)'
          : err.name === 'NotFoundError'
            ? 'No microphone found. Check your device.'
            : 'Mic error: ' + err.message,
        { duration: 6000 }
      );
      return;
    }

    // ✅ Step 3: Start recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      console.log('🎤 Listening started');
      setListening(true);
      setTranscript('');
      setCurrentScore(null);
    };

    recognition.onresult = (event) => {
      const spoken = event.results[0][0].transcript.trim().toLowerCase();
      console.log('🎤 Heard:', spoken, '| Confidence:', event.results[0][0].confidence);
      setTranscript(spoken);
      checkAnswer(spoken);
    };

    recognition.onerror = (event) => {
      console.error('❌ Speech error:', event.error);
      setListening(false);

      if (event.error === 'no-speech') {
        toast.error('No speech detected. Please speak clearly.', { duration: 4000 });
      } else if (event.error === 'audio-capture') {
        toast.error('Microphone not capturing. Check Windows mic settings.', { duration: 5000 });
      } else if (event.error === 'not-allowed') {
        toast.error('Mic permission denied. Click 🔒 in URL bar → Allow.', { duration: 6000 });
      } else if (event.error === 'network') {
        toast.error('Network error. Speech recognition needs internet.', { duration: 4000 });
      } else {
        toast.error(`Speech error: ${event.error}`, { duration: 4000 });
      }
    };

    recognition.onend = () => {
      console.log('🎤 Listening ended');
      setListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('❌ Failed to start recognition:', err);
      toast.error('Could not start mic. Try Chrome/Edge.');
    }
  };

  const levenshteinSimilarity = (a, b) => {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

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
    return 1 - matrix[b.length][a.length] / Math.max(a.length, b.length);
  };

  const checkAnswer = (spoken) => {
    const q = game.questions[currentQ];
    const expected = (q.correct === 'a' ? q.option_a : q.option_b).toLowerCase();
    const similarity = levenshteinSimilarity(spoken, expected);
    const score = Math.round(similarity * 100);

    setCurrentScore(score);

    const isCorrect = score >= 70;
    setResults([...results, {
      q,
      spoken,
      expected,
      score,
      isCorrect,
    }]);
  };

  const nextQuestion = () => {
    if (currentQ + 1 < game.questions.length) {
      setCurrentQ(currentQ + 1);
      setTranscript('');
      setCurrentScore(null);
      setShowHint(false);
    }
  };

  const finishPractice = async () => {
    try {
      const userAnswers = {};
      results.forEach((r, i) => {
        userAnswers[String(r.q.question_id)] = r.spoken;
      });

      const { data } = await api.post(`/games/auto-test/${game.session_id}`, {
        game_type: 'pronunciation',
        questions: game.questions,
        user_answers: userAnswers,
      });

      console.log('📊 Final result:', data);
      toast.success(`Practice complete! Accuracy: ${data.accuracy}%`);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Could not save results');
    }
  };

  if (loading) {
    return (
      <div className="dash-layout">
        <Sidebar />
        <main className="dash-main">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            gap: 16,
          }}>
            <div className="game-loading-spinner" />
            <p style={{ color: '#5a6b8c', fontSize: 14 }}>
              Loading speech practice...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!game || !game.questions) {
    return (
      <div className="dash-layout">
        <Sidebar />
        <main className="dash-main">
          <div className="dash-topbar">
            <div>
              <h1 className="dash-greeting">Speech Practice</h1>
            </div>
          </div>
          <div className="dash-progress-card" style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#5a6b8c', marginBottom: 16 }}>
              Could not load game. Try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                background: '#1e6ef5',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  const q = game.questions[currentQ];
  const isComplete = currentQ >= game.questions.length;
  const correctWord = q ? (q.correct === 'a' ? q.option_a : q.option_b) : '';
  const progress = ((currentQ + 1) / game.questions.length) * 100;

  if (isComplete) {
    const correctCount = results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctCount / results.length) * 100);

    return (
      <div className="dash-layout">
        <Sidebar />
        <main className="dash-main">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="dash-progress-card"
            style={{ textAlign: 'center', padding: 40 }}
          >
            <div style={{ fontSize: 60, marginBottom: 16 }}>
              {accuracy >= 70 ? '🎉' : '💪'}
            </div>
            <h2 style={{
              fontFamily: 'Manrope',
              fontSize: '1.8rem',
              color: '#102a56',
              marginBottom: 8,
            }}>
              Speech Practice Complete!
            </h2>
            <p style={{ color: '#5a6b8c', marginBottom: 24 }}>
              {correctCount} / {results.length} correct ({accuracy}%)
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 500, margin: '0 auto 32px' }}>
              <div style={{ padding: 20, background: '#f0fdf4', borderRadius: 12 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>
                  {correctCount}
                </div>
                <div style={{ fontSize: 12, color: '#5a6b8c' }}>Correct</div>
              </div>
              <div style={{ padding: 20, background: '#fef2f2', borderRadius: 12 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444' }}>
                  {results.length - correctCount}
                </div>
                <div style={{ fontSize: 12, color: '#5a6b8c' }}>Wrong</div>
              </div>
              <div style={{ padding: 20, background: '#f5f3ff', borderRadius: 12 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#a855f7' }}>
                  {accuracy}%
                </div>
                <div style={{ fontSize: 12, color: '#5a6b8c' }}>Accuracy</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link to="/games" style={{
                padding: '12px 24px',
                background: 'white',
                color: '#1e6ef5',
                border: '2px solid #1e6ef5',
                borderRadius: 10,
                textDecoration: 'none',
                fontWeight: 600,
              }}>
                <Home size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Games Menu
              </Link>
              <button
                onClick={finishPractice}
                style={{
                  padding: '12px 24px',
                  background: '#1e6ef5',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Save & Finish
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-main">
        <div className="dash-topbar">
          <div>
            <h1 className="dash-greeting" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mic size={28} color="#a855f7" /> Speech Practice
            </h1>
            <p className="dash-subtext">
              Listen to the word, then speak it back
            </p>
          </div>
          <button
            onClick={() => navigate('/games')}
            style={{
              padding: '10px 16px',
              background: 'white',
              border: '1px solid #e8f0fe',
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: '#5a6b8c',
            }}
          >
            <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Back
          </button>
        </div>

        <motion.div
          key={currentQ}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dash-progress-card"
          style={{ padding: 32 }}
        >
          {/* Progress */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#5a6b8c', fontWeight: 600 }}>
                Question {currentQ + 1} / {game.questions.length}
              </span>
              <span style={{
                padding: '4px 12px',
                background: '#f5f3ff',
                color: '#7c3aed',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
              }}>
                🎯 {q.sound_contrast || 'practice'}
              </span>
            </div>
            <div style={{ height: 6, background: '#e8f0fe', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #a855f7, #7c3aed)',
                transition: 'width 0.3s',
              }} />
            </div>
          </div>

          {/* Audio Play */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <button
              onClick={() => playAudio(q.play_audio)}
              disabled={playing}
              style={{
                width: 100, height: 100, borderRadius: '50%',
                background: playing ? '#9ca3af' : 'linear-gradient(135deg, #1e6ef5, #1554c9)',
                color: 'white', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: '0 8px 24px rgba(30, 110, 245, 0.3)',
              }}
            >
              <Volume2 size={40} />
            </button>
            <p style={{ fontSize: 13, color: '#5a6b8c' }}>
              {playing ? '🔊 Playing...' : 'Tap to hear the word'}
            </p>
          </div>

          {/* Target Word Hint */}
          <div style={{
            maxWidth: 400,
            margin: '0 auto 24px',
            padding: 20,
            background: 'linear-gradient(135deg, #f8faff, #eef2ff)',
            borderRadius: 16,
            border: '2px dashed #a855f7',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 12, color: '#7c3aed', fontWeight: 700,
              marginBottom: 12, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
            }}>
              <Eye size={14} /> Target Word
            </div>
            {showHint ? (
              <div style={{
                fontSize: 36, fontWeight: 800, color: '#7c3aed',
                fontFamily: 'Manrope', letterSpacing: 2,
              }}>
                {correctWord}
              </div>
            ) : (
              <div style={{
                fontSize: 24, fontWeight: 800, color: '#cbd5e1',
                fontFamily: 'Manrope', letterSpacing: 8,
              }}>
                {'•'.repeat(correctWord.length)}
              </div>
            )}
            <button
              onClick={() => setShowHint(!showHint)}
              style={{
                marginTop: 12, padding: '6px 14px',
                background: 'white', color: '#7c3aed',
                border: '1px solid #e8f0fe', borderRadius: 8,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              {showHint ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Show Word</>}
            </button>
          </div>

          {/* Mic Button */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={startListening}
              disabled={listening}
              style={{
                width: 100, height: 100, borderRadius: '50%',
                background: listening
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #a855f7, #7c3aed)',
                color: 'white', border: 'none',
                cursor: listening ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto',
                boxShadow: listening
                  ? '0 0 0 20px rgba(239, 68, 68, 0.15), 0 12px 30px rgba(239, 68, 68, 0.4)'
                  : '0 12px 30px rgba(168, 85, 247, 0.35)',
                transition: 'all 0.3s',
              }}
            >
              {listening ? <Loader size={40} className="spin" /> : <Mic size={40} />}
            </motion.button>
            <p style={{ fontSize: 13, color: '#5a6b8c', marginTop: 12 }}>
              {listening ? '🎤 Listening... speak now' : 'Tap to speak'}
            </p>

            {transcript && (
              <div style={{
                marginTop: 16, padding: 16, background: '#f5f8ff',
                borderRadius: 10, fontSize: 15, color: '#102a56',
                fontWeight: 600, maxWidth: 400, margin: '16px auto 0',
              }}>
                You said: "{transcript}"
              </div>
            )}
          </div>

          {/* Score Display */}
          <AnimatePresence>
            {currentScore !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  background: currentScore >= 70 ? '#f0fdf4' : '#fef2f2',
                  border: `2px solid ${currentScore >= 70 ? '#10b981' : '#ef4444'}`,
                  textAlign: 'center',
                  maxWidth: 400,
                  margin: '0 auto 20px',
                }}
              >
                <div style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: currentScore >= 70 ? '#10b981' : '#ef4444',
                  fontFamily: 'Manrope',
                }}>
                  {currentScore}%
                </div>
                <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 12 }}>
                  {currentScore >= 90 ? '🌟 Perfect!' :
                    currentScore >= 70 ? '✅ Good!' :
                      currentScore >= 50 ? '👍 Close!' : '❌ Try again'}
                </div>
                {currentScore >= 70 && currentQ + 1 < game.questions.length && (
                  <button
                    onClick={nextQuestion}
                    style={{
                      padding: '10px 24px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Next Word →
                  </button>
                )}
                {currentScore >= 70 && currentQ + 1 >= game.questions.length && (
                  <button
                    onClick={() => setCurrentQ(game.questions.length)}
                    style={{
                      padding: '10px 24px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    See Results →
                  </button>
                )}
                {currentScore < 70 && (
                  <button
                    onClick={() => {
                      setTranscript('');
                      setCurrentScore(null);
                    }}
                    style={{
                      padding: '10px 24px',
                      background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Try Again
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  );
}