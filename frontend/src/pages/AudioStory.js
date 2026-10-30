import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Volume2, CheckCircle, XCircle, Home, RotateCcw,
  BookOpen, ChevronRight, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

export default function AudioStory() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('loading');
  const [session, setSession] = useState(null);
  const [stories, setStories] = useState([]);
  const [storyIndex, setStoryIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});  // { storyId: [ans1, ans2, ans3] }
  const [completed, setCompleted] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [showText, setShowText] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  // Load game
  useEffect(() => {
    api.post('/games/generate/audio_story', {
      difficulty: 'easy',
      question_count: 3,
    })
      .then(({ data }) => {
        console.log('📖 Audio Story game:', data);
        if (!data.questions || data.questions.length === 0) {
          toast.error('No stories generated');
          setStage('complete');
          return;
        }
        setSession(data.session_id);
        setStories(data.questions);
        setStage('playing');
      })
      .catch((err) => {
        console.error(err);
        toast.error('Could not generate game');
        setStage('complete');
      });
  }, []);

  const currentStory = stories[storyIndex];
  const currentQuestion = currentStory?.questions?.[questionIndex];

  // Play story audio
  const playAudio = () => {
    if (!currentStory?.audio) return;
    setPlaying(true);
    const audio = new Audio(`http://localhost:5000/static/audio/${currentStory.audio}`);
    audio.play().catch(() => toast.error('Audio failed'));
    audio.onended = () => setPlaying(false);
  };

  // Answer selection
  const handleAnswer = (optionIdx) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(optionIdx);
    
    const storyId = currentStory.question_id;
    const currentAnswers = answers[storyId] || [];
    const updated = [...currentAnswers];
    updated[questionIndex] = optionIdx;
    
    setAnswers(prev => ({
      ...prev,
      [storyId]: updated,
    }));
  };

  // Next question
  const nextQuestion = () => {
    if (questionIndex + 1 < currentStory.questions.length) {
      setQuestionIndex(questionIndex + 1);
      setSelectedAnswer(null);
    } else {
      // Move to next story
      if (storyIndex + 1 < stories.length) {
        setStoryIndex(storyIndex + 1);
        setQuestionIndex(0);
        setSelectedAnswer(null);
        setShowText(false);
      } else {
        finishGame();
      }
    }
  };

  // Finish game
  const finishGame = async () => {
    try {
      const { data } = await api.post(`/games/auto-test/${session}`, {
        game_type: 'audio_story',
        questions: stories,
        user_answers: answers,
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
              <p>Generating audio stories...</p>
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
                {completed.accuracy >= 70 ? '📖' : '📚'}
              </div>
              <h2 className="game-complete-title">Story Comprehension Complete!</h2>
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

              {/* Per-story breakdown */}
              <div style={{
                maxWidth: 500,
                margin: '0 auto 24px',
                maxHeight: 300,
                overflowY: 'auto',
              }}>
                {completed.results.map((r, i) => (
                  <div key={i} style={{
                    marginBottom: 12,
                    padding: 14,
                    borderRadius: 12,
                    background: r.correct === r.total ? '#f0fdf4' : r.correct > 0 ? '#fef3c7' : '#fef2f2',
                    border: `1px solid ${r.correct === r.total ? '#d1fae5' : r.correct > 0 ? '#fde68a' : '#fecaca'}`,
                  }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#102a56',
                      marginBottom: 6,
                    }}>
                      📖 Story {r.question_id}: {r.story_text}
                    </div>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: r.correct === r.total ? '#10b981' : '#5a6b8c',
                    }}>
                      {r.correct}/{r.total} questions correct
                    </div>
                  </div>
                ))}
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
  if (!currentStory) {
    return (
      <div className="game-page">
        <Sidebar />
        <main className="game-main">
          <div className="game-card">
            <p>Loading story...</p>
          </div>
        </main>
      </div>
    );
  }

  const storyProgress = ((storyIndex + 1) / stories.length) * 100;
  const questionProgress = ((questionIndex + 1) / currentStory.questions.length) * 100;
  const isAnswered = selectedAnswer !== null;

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
                Story {storyIndex + 1}/{stories.length} · Q{questionIndex + 1}/{currentStory.questions.length}
              </span>
              <div className="game-progress-bar">
                <div
                  className="game-progress-fill"
                  style={{
                    width: `${storyProgress * 0.4 + questionProgress * 0.6}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="game-body">
            {/* Story badge */}
            <div style={{
              padding: '4px 14px',
              background: '#f0fdf4',
              color: '#059669',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 16,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <BookOpen size={12} /> Story {storyIndex + 1} of {stories.length}
            </div>

            {/* Story audio */}
            <div style={{
              padding: 24,
              background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              borderRadius: 20,
              marginBottom: 20,
              border: '2px solid #86efac',
              textAlign: 'center',
            }}>
              <p style={{
                fontSize: 12,
                color: '#059669',
                marginBottom: 12,
                fontWeight: 600,
              }}>
                🎧 LISTEN TO THE STORY
              </p>
              <button
                onClick={playAudio}
                disabled={playing}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: playing
                    ? '#9ca3af'
                    : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                }}
              >
                <Volume2 size={32} />
              </button>
              <p style={{
                fontSize: 12,
                color: '#5a6b8c',
                marginBottom: 8,
              }}>
                {playing ? '🔊 Playing...' : 'Tap to play the story'}
              </p>

              {/* Show text toggle */}
              <button
                onClick={() => setShowText(!showText)}
                style={{
                  padding: '6px 14px',
                  background: 'white',
                  color: '#059669',
                  border: '1px solid #86efac',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {showText ? (
                  <><EyeOff size={12} /> Hide Text</>
                ) : (
                  <><Eye size={12} /> Show Text</>
                )}
              </button>

              <AnimatePresence>
                {showText && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      marginTop: 12,
                      padding: 12,
                      background: 'white',
                      borderRadius: 10,
                      fontSize: 14,
                      color: '#102a56',
                      fontStyle: 'italic',
                    }}
                  >
                    "{currentStory.story_text}"
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Question progress */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 6,
              marginBottom: 16,
            }}>
              {currentStory.questions.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 32,
                    height: 6,
                    borderRadius: 3,
                    background: idx <= questionIndex ? '#10b981' : '#e5e7eb',
                    transition: 'all 0.3s',
                  }}
                />
              ))}
            </div>

            {/* Current question */}
            <div style={{
              padding: 20,
              background: '#f8faff',
              borderRadius: 16,
              marginBottom: 20,
            }}>
              <p style={{
                fontSize: 11,
                color: '#5a6b8c',
                marginBottom: 8,
                fontWeight: 600,
              }}>
                Question {questionIndex + 1} of {currentStory.questions.length}
              </p>
              <h3 style={{
                fontFamily: 'Manrope',
                fontSize: '1.2rem',
                fontWeight: 800,
                color: '#102a56',
                marginBottom: 20,
              }}>
                {currentQuestion.q}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === currentQuestion.correct;

                  let bg = 'white';
                  let borderColor = '#e8f0fe';
                  let color = '#102a56';
                  let icon = null;

                  if (isAnswered) {
                    if (isCorrect) {
                      bg = '#f0fdf4';
                      borderColor = '#10b981';
                      color = '#059669';
                      icon = <CheckCircle size={18} color="#10b981" />;
                    } else if (isSelected) {
                      bg = '#fef2f2';
                      borderColor = '#ef4444';
                      color = '#dc2626';
                      icon = <XCircle size={18} color="#ef4444" />;
                    }
                  } else if (isSelected) {
                    bg = '#eff6ff';
                    borderColor = '#1e6ef5';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={isAnswered}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        background: bg,
                        border: `2px solid ${borderColor}`,
                        fontSize: 14,
                        fontWeight: 600,
                        color,
                        cursor: isAnswered ? 'default' : 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        transition: 'all 0.2s',
                      }}
                    >
                      <span style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: isAnswered && isCorrect ? '#10b981' : '#e8f0fe',
                        color: isAnswered && isCorrect ? 'white' : '#5a6b8c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 12,
                        flexShrink: 0,
                      }}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span style={{ flex: 1 }}>{option}</span>
                      {icon}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next button */}
            {isAnswered && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={nextQuestion}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  margin: '0 auto',
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                }}
              >
                {questionIndex + 1 < currentStory.questions.length
                  ? <>Next Question <ChevronRight size={16} /></>
                  : storyIndex + 1 < stories.length
                  ? <>Next Story <ChevronRight size={16} /></>
                  : <>Finish <CheckCircle size={16} /></>
                }
              </motion.button>
            )}
          </div>

          {/* Footer */}
          <div className="game-footer">
            <div className="game-timer">
              Story {storyIndex + 1} of {stories.length}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}