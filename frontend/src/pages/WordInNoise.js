import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Volume2, CheckCircle, XCircle, Home, RotateCcw,
  Volume1, Waves
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

export default function WordInNoise() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('loading');
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    api.post('/games/generate/word_in_noise', {
      difficulty: 'medium',
      question_count: 8,
    })
      .then(({ data }) => {
        console.log('🎯 Word in Noise:', data);
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

  const playAudio = () => {
    if (!q?.play_audio) return toast.error('Audio not available');
    setPlaying(true);
    const audio = new Audio(`http://localhost:5000/static/audio/${q.play_audio}`);
    audio.play().catch(() => toast.error('Audio failed'));
    audio.onended = () => setPlaying(false);
  };

  const handleAnswer = (choice) => {
    if (answers[String(q.question_id)]) return;
    const qid = String(q.question_id);
    setAnswers(prev => ({ ...prev, [qid]: choice }));
    
    setTimeout(() => {
      if (index + 1 < questions.length) setIndex(index + 1);
      else finishGame({ ...answers, [qid]: choice });
    }, 1000);
  };

  const finishGame = async (allAnswers) => {
    try {
      const { data } = await api.post(`/games/auto-test/${session}`, {
        game_type: 'word_in_noise',
        questions,
        user_answers: allAnswers || answers,
      });
      setCompleted(data);
      setStage('complete');
    } catch (err) {
      console.error(err);
      toast.error('Could not complete');
      navigate('/games');
    }
  };

  if (stage === 'loading') {
    return (
      <div className="game-page">
        <Sidebar />
        <main className="game-main">
          <div className="game-card">
            <div className="game-loading">
              <div className="game-loading-spinner" />
              <p>Mixing noise + audio...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
                {completed.accuracy >= 70 ? '🎯' : '🔊'}
              </div>
              <h2 className="game-complete-title">Noise Challenge Complete!</h2>
              <p className="game-complete-sub">{completed.ai_feedback}</p>

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

  const answered = q ? answers[String(q.question_id)] : null;
  const progress = ((index + 1) / questions.length) * 100;

  return (
    <div className="game-page">
      <Sidebar />
      <main className="game-main">
        <div className="game-card">
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

          <div className="game-body">
            <div style={{
              padding: '4px 14px',
              background: '#eff6ff',
              color: '#1e6ef5',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 20,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <Waves size={12} /> Listen through the background noise
            </div>

            {/* SNR badge */}
            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              background: q.snr_db >= 15 ? '#f0fdf4' : q.snr_db >= 10 ? '#fef3c7' : '#fef2f2',
              color: q.snr_db >= 15 ? '#059669' : q.snr_db >= 10 ? '#b45309' : '#dc2626',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600,
              marginBottom: 20,
              marginLeft: 8,
            }}>
              SNR: {q.snr_db} dB
            </div>

            <button
              className={`game-audio-btn ${playing ? 'playing' : ''}`}
              onClick={playAudio}
              disabled={!!answered}
              style={{
                background: playing
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #1e6ef5, #1554c9)',
                margin: '0 auto',
                display: 'block',
              }}
            >
              <Volume2 size={36} />
            </button>
            <p style={{ fontSize: 13, color: '#5a6b8c', marginTop: 16, marginBottom: 24, textAlign: 'center' }}>
              {playing ? '🔊 Playing through noise...' : 'Tap to hear word through noise'}
            </p>

            <h2 className="game-question">Which word did you hear?</h2>

            <div className="game-options">
              {['a', 'b'].map((opt) => {
                const word = opt === 'a' ? q.word_a : q.word_b;
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

            <AnimatePresence>
              {answered && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`game-result-banner ${answered === q.correct ? 'correct' : 'wrong'}`}
                  style={{ marginTop: 24 }}
                >
                  {answered === q.correct ? (
                    <><CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Correct!</>
                  ) : (
                    <><XCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Wrong! The correct answer was "{q.correct === 'a' ? q.word_a : q.word_b}"</>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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