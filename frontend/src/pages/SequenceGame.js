import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Volume2, Clock, Home, RotateCcw,
  CheckCircle, XCircle, Play, ListChecks
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

export default function SequenceGame() {
  const navigate = useNavigate();

  const [stage, setStage] = useState('loading'); // loading | playing | complete
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [completed, setCompleted] = useState(null);
  const [playingSequence, setPlayingSequence] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(null);
  const audioRef = useRef(null);

  // Load AI game
  useEffect(() => {
    api.post('/games/generate/sequence', {
      difficulty: 'easy',
      question_count: 5,
    })
      .then(({ data }) => {
        console.log('🎮 AI Generated Sequence Game:', data);
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

  // ============ PLAY SEQUENCE ============
  const playSequence = () => {
    if (!q || playingSequence) return;
    setPlayingSequence(true);
    setPlayingIndex(0);

    let i = 0;
    const playNext = () => {
      if (i >= q.audios.length) {
        setPlayingSequence(false);
        setPlayingIndex(null);
        return;
      }
      setPlayingIndex(i);
      const audio = new Audio(`http://localhost:5000/static/audio/${q.audios[i]}`);
      audioRef.current = audio;
      audio.play().catch(() => toast.error('Audio failed'));
      audio.onended = () => {
        i++;
        setTimeout(playNext, 400);
      };
    };
    playNext();
  };

  // ============ SELECT OPTION ============
  const handleSelect = (optionIndex) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIndex);

    const qid = String(q.question_id);
    setAnswers(prev => ({ ...prev, [qid]: optionIndex }));
    console.log(`✅ Q${qid}: Selected option ${optionIndex} | Correct: ${q.correct}`);

    setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex(index + 1);
        setSelectedOption(null);
      } else {
        finishGame();
      }
    }, 1200);
  };

  const finishGame = async () => {
    try {
      const { data } = await api.post(`/games/auto-test/${session}`, {
        game_type: 'sequence',
        questions,
        user_answers: answers,
      });
      console.log('📥 AI Result:', data);
      setCompleted(data);
      setStage('complete');
    } catch (err) {
      console.error(err);
      toast.error('Could not save session');
      navigate('/dashboard');
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
              <p>AI is preparing your sequence memory game...</p>
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
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="game-card">
            <div className="game-complete">
              <div className="game-complete-icon">🧠</div>
              <h2 className="game-complete-title">Sequence Complete!</h2>
              <p className="game-complete-sub">{completed.ai_feedback}</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, maxWidth: 500, margin: '0 auto 32px' }}>
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

  // ============ PLAYING ============
  const progress = ((index + 1) / questions.length) * 100;

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
                <div className="game-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="game-body">
            <h2 className="game-question">What was the sequence?</h2>
            <p style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 20 }}>
              Tap play to hear the sequence, then choose the correct order.
            </p>

            {/* Play button */}
            <button
              onClick={playSequence}
              disabled={playingSequence}
              style={{
                padding: '16px 32px',
                borderRadius: 12,
                background: playingSequence ? '#9ca3af' : '#1e6ef5',
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                margin: '0 auto 24px',
                cursor: playingSequence ? 'wait' : 'pointer',
              }}
            >
              <Volume2 size={22} />
              {playingSequence ? 'Playing...' : 'Play Sequence'}
            </button>

            {/* Playing indicator */}
            {playingSequence && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                {q.audios.map((_, i) => (
                  <div key={i} style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: playingIndex === i ? '#a855f7' : '#e8f0fe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: playingIndex === i ? 'white' : '#5a6b8c',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                  }}>
                    {i + 1}
                  </div>
                ))}
              </div>
            )}

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500, margin: '0 auto' }}>
              {q.options.map((option, optIdx) => {
                const isSelected = selectedOption === optIdx;
                const isCorrect = optIdx === q.correct;
                let bg = 'white';
                let border = '2px solid #e8f0fe';
                let color = '#102a56';

                if (selectedOption !== null) {
                  if (isCorrect) {
                    bg = '#d1fae5'; border = '2px solid #10b981'; color = '#059669';
                  } else if (isSelected) {
                    bg = '#fee2e2'; border = '2px solid #ef4444'; color = '#dc2626';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelect(optIdx)}
                    disabled={selectedOption !== null}
                    style={{
                      padding: 16, borderRadius: 10,
                      background: bg, border, color,
                      fontSize: 16, fontWeight: 600,
                      textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 12,
                      cursor: selectedOption !== null ? 'default' : 'pointer',
                    }}
                  >
                    <span style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: isCorrect && selectedOption !== null ? '#10b981' : '#e8f0fe',
                      color: isCorrect && selectedOption !== null ? 'white' : '#5a6b8c',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 14,
                    }}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{option.join(' → ')}</span>
                    {selectedOption !== null && isCorrect && <CheckCircle size={18} style={{ marginLeft: 'auto', color: '#10b981' }} />}
                    {selectedOption !== null && isSelected && !isCorrect && <XCircle size={18} style={{ marginLeft: 'auto', color: '#ef4444' }} />}
                  </button>
                );
              })}
            </div>
          </div>

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