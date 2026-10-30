import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Sparkles, CheckCircle, XCircle, Loader, RefreshCw,
  Volume2, Trophy, Target, Zap, Flame, TrendingUp, Award,
  Play, Settings, BarChart3, Clock, ArrowRight, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

const presets = [
  {
    id: 'quick',
    name: 'Quick Test',
    desc: '5 questions · ~2 min',
    icon: Zap,
    color: '#10b981',
    bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
    config: { question_count: 5, difficulty: 'easy' },
  },
  {
    id: 'standard',
    name: 'Standard',
    desc: '10 questions · ~4 min',
    icon: Star,
    color: '#f59e0b',
    bg: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    config: { question_count: 10, difficulty: 'medium' },
  },
  {
    id: 'challenge',
    name: 'Challenge',
    desc: '15 questions · ~6 min',
    icon: Flame,
    color: '#ef4444',
    bg: 'linear-gradient(135deg, #fee2e2, #fecaca)',
    config: { question_count: 15, difficulty: 'hard' },
  },
];

export default function AILab() {
  const navigate = useNavigate();

  const [stage, setStage] = useState('idle');
  const [config, setConfig] = useState({
    difficulty: 'easy',
    focus_area: '',
    question_count: 5,
  });
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [game, setGame] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(null);
  const [aiStats, setAiStats] = useState(null);

  useEffect(() => {
    api.get('/ai/stats').then(r => setAiStats(r.data)).catch(() => {});
  }, [stage]);

  // ================= GENERATE GAME =================
  const generateGame = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/ai/generate-game', {
        difficulty: config.difficulty,
        focus_area: config.focus_area || undefined,
        question_count: config.question_count,
      });
      if (!data.questions || data.questions.length === 0) {
        toast.error('AI could not generate questions');
        return;
      }
      setGame(data);
      setCurrentQ(0);
      setAnswers({});
      setStage('testing');
      toast.success(`AI generated ${data.total_questions} questions!`);
    } catch (err) {
      toast.error('AI could not generate game');
    } finally {
      setLoading(false);
    }
  };

  // ================= AUDIO =================
  const playAudio = (path) => {
    if (!path) return toast.error('Audio not available');
    setPlaying(path);
    const audio = new Audio(`http://localhost:5000/static/audio/${path}`);
    audio.play().catch(() => toast.error('Audio play failed'));
    audio.onended = () => setPlaying(null);
  };

  // ================= SELECT ANSWER =================
  const selectAnswer = (choice) => {
    const qid = String(game.questions[currentQ].question_id);
    setAnswers(prev => ({ ...prev, [qid]: choice }));
    if (currentQ + 1 < game.questions.length) {
      setTimeout(() => setCurrentQ(currentQ + 1), 400);
    }
  };

  // ================= SUBMIT TEST =================
  const submitTest = async () => {
    const allAnswered = game.questions.every(
      q => answers[String(q.question_id)] !== undefined
    );
    if (!allAnswered) {
      toast.error('Please answer all questions');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post(`/ai/auto-test/${game.session_id}`, {
        questions: game.questions,
        user_answers: answers,
      });
      setResult(data);
      setStage('results');
      if (data.accuracy >= 80) toast.success('🌟 Excellent!');
    } catch (err) {
      toast.error('AI test failed');
    } finally {
      setLoading(false);
    }
  };

  // ================= RESET =================
  const reset = () => {
    setStage('idle');
    setGame(null);
    setResult(null);
    setAnswers({});
    setCurrentQ(0);
    setSelectedPreset(null);
  };

  // ================= DERIVED =================
  const q = game?.questions?.[currentQ];
  const answered = q ? answers[String(q.question_id)] : null;
  const progress = game ? ((currentQ + 1) / game.questions.length) * 100 : 0;

  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-main">
        {/* ===================== HERO HEADER ===================== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #1e6ef5 0%, #a855f7 100%)',
            borderRadius: 24,
            padding: '36px 40px',
            marginBottom: 28,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(30, 110, 245, 0.25)',
          }}
        >
          {/* Decorative bubbles */}
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 200, height: 200, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }} />
          <div style={{
            position: 'absolute', bottom: -60, right: 100,
            width: 140, height: 140, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 24 }}>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{
                width: 80, height: 80, borderRadius: 20,
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <Brain size={44} color="white" />
            </motion.div>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontFamily: 'Manrope', fontSize: '2rem', fontWeight: 800,
                color: 'white', marginBottom: 6,
              }}>
                AI Lab
              </h1>
              <p style={{
                fontSize: 15, color: 'rgba(255,255,255,0.9)', margin: 0,
                maxWidth: 600, lineHeight: 1.5,
              }}>
                Let AI generate personalized listening tests based on your weak areas.
                Every question is fresh, every test is unique.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ===================== STATS ===================== */}
        {aiStats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
            marginBottom: 28,
          }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              style={{
                background: 'white', borderRadius: 16, padding: 24,
                border: '1px solid #e8f0fe',
                boxShadow: '0 4px 20px rgba(16, 42, 86, 0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 8 }}>AI Games Played</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#102a56', lineHeight: 1 }}>
                    {aiStats.total_ai_sessions}
                  </div>
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(168, 85, 247, 0.3)',
                }}>
                  <Trophy size={22} color="white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                background: 'white', borderRadius: 16, padding: 24,
                border: '1px solid #e8f0fe',
                boxShadow: '0 4px 20px rgba(16, 42, 86, 0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 8 }}>AI Attempts</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#102a56', lineHeight: 1 }}>
                    {aiStats.total_ai_attempts}
                  </div>
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'linear-gradient(135deg, #1e6ef5, #1554c9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(30, 110, 245, 0.3)',
                }}>
                  <Target size={22} color="white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{
                background: 'white', borderRadius: 16, padding: 24,
                border: '1px solid #e8f0fe',
                boxShadow: '0 4px 20px rgba(16, 42, 86, 0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 8 }}>AI Accuracy</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#102a56', lineHeight: 1 }}>
                    {aiStats.avg_accuracy}%
                  </div>
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
                }}>
                  <TrendingUp size={22} color="white" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ===================== IDLE STAGE ===================== */}
        <AnimatePresence mode="wait">
          {stage === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                background: 'white',
                borderRadius: 20,
                padding: 32,
                border: '1px solid #e8f0fe',
                boxShadow: '0 4px 20px rgba(16, 42, 86, 0.06)',
              }}
            >
              <h2 style={{
                fontFamily: 'Manrope', fontSize: '1.3rem', fontWeight: 800,
                color: '#102a56', marginBottom: 6,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <Settings size={22} color="#1e6ef5" /> Configure Your AI Test
              </h2>
              <p style={{ fontSize: 14, color: '#5a6b8c', marginBottom: 24 }}>
                Pick a quick preset or customize your own test.
              </p>

              {/* Preset Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
                marginBottom: 28,
              }}>
                {presets.map((preset, i) => (
                  <motion.div
                    key={preset.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(16,42,86,0.12)' }}
                    onClick={() => {
                      setSelectedPreset(preset.id);
                      setConfig({ ...config, ...preset.config });
                    }}
                    style={{
                      padding: 24,
                      borderRadius: 16,
                      background: selectedPreset === preset.id ? preset.bg : '#f8faff',
                      border: selectedPreset === preset.id
                        ? `2px solid ${preset.color}`
                        : '2px solid #e8f0fe',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: selectedPreset === preset.id ? preset.color : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 16,
                      transition: 'all 0.2s',
                    }}>
                      <preset.icon
                        size={24}
                        color={selectedPreset === preset.id ? 'white' : preset.color}
                      />
                    </div>
                    <div style={{
                      fontFamily: 'Manrope', fontSize: 16, fontWeight: 800,
                      color: '#102a56', marginBottom: 4,
                    }}>
                      {preset.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#5a6b8c' }}>
                      {preset.desc}
                    </div>
                    {selectedPreset === preset.id && (
                      <div style={{
                        position: 'absolute', top: 12, right: 12,
                        width: 24, height: 24, borderRadius: '50%',
                        background: preset.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <CheckCircle size={16} color="white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Custom Configuration */}
              <div style={{
                padding: 24,
                background: '#f8faff',
                borderRadius: 16,
                marginBottom: 24,
              }}>
                <h3 style={{
                  fontSize: 14, fontWeight: 700, color: '#102a56',
                  marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Settings size={16} color="#5a6b8c" /> Fine-tune your test
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#5a6b8c', marginBottom: 6, display: 'block' }}>
                      Difficulty
                    </label>
                    <select
                      value={config.difficulty}
                      onChange={(e) => setConfig({ ...config, difficulty: e.target.value })}
                      style={{
                        width: '100%', padding: '10px 14px',
                        borderRadius: 10, border: '1px solid #e8f0fe',
                        fontSize: 14, background: 'white',
                        fontWeight: 600, color: '#102a56',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="easy">🟢 Easy</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="hard">🔴 Hard</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#5a6b8c', marginBottom: 6, display: 'block' }}>
                      Questions
                    </label>
                    <select
                      value={config.question_count}
                      onChange={(e) => setConfig({ ...config, question_count: Number(e.target.value) })}
                      style={{
                        width: '100%', padding: '10px 14px',
                        borderRadius: 10, border: '1px solid #e8f0fe',
                        fontSize: 14, background: 'white',
                        fontWeight: 600, color: '#102a56',
                        cursor: 'pointer',
                      }}
                    >
                      <option value={5}>5 questions</option>
                      <option value={10}>10 questions</option>
                      <option value={15}>15 questions</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#5a6b8c', marginBottom: 6, display: 'block' }}>
                      Focus Area (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="/ɪ/ vs /iː/"
                      value={config.focus_area}
                      onChange={(e) => setConfig({ ...config, focus_area: e.target.value })}
                      style={{
                        width: '100%', padding: '10px 14px',
                        borderRadius: 10, border: '1px solid #e8f0fe',
                        fontSize: 14, background: 'white',
                        fontWeight: 600, color: '#102a56',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateGame}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: 'linear-gradient(135deg, #1e6ef5, #a855f7)',
                  color: 'white',
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: 700,
                  border: 'none',
                  cursor: loading ? 'wait' : 'pointer',
                  boxShadow: '0 8px 24px rgba(30, 110, 245, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                {loading ? (
                  <><Loader size={20} /> AI is generating...</>
                ) : (
                  <><Sparkles size={20} /> Generate AI Test</>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* ===================== TESTING STAGE ===================== */}
          {stage === 'testing' && q && (
            <motion.div
              key="testing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                background: 'white',
                borderRadius: 20,
                padding: 32,
                border: '1px solid #e8f0fe',
                boxShadow: '0 4px 20px rgba(16, 42, 86, 0.06)',
              }}
            >
              {/* Progress bar */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 16,
              }}>
                <h3 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, color: '#102a56', margin: 0 }}>
                  Question {currentQ + 1} of {game.questions.length}
                </h3>
                <span style={{
                  padding: '4px 12px',
                  background: '#f5f3ff',
                  color: '#a855f7',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  {q.sound_contrast}
                </span>
              </div>

              <div style={{ height: 8, background: '#e8f0fe', borderRadius: 4, marginBottom: 32, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #1e6ef5, #a855f7)',
                    borderRadius: 4,
                  }}
                />
              </div>

              {/* Audio visualizer */}
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => playAudio(q.play_audio)}
                  style={{
                    width: 120, height: 120, borderRadius: '50%',
                    background: playing === q.play_audio
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'linear-gradient(135deg, #a855f7, #7c3aed)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: playing === q.play_audio
                      ? '0 0 0 20px rgba(239, 68, 68, 0.15), 0 12px 30px rgba(239, 68, 68, 0.3)'
                      : '0 12px 30px rgba(168, 85, 247, 0.35)',
                    transition: 'all 0.3s',
                  }}
                >
                  {playing === q.play_audio ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'end', height: 40 }}>
                      {[0, 1, 2, 3, 4].map(i => (
                        <motion.div
                          key={i}
                          animate={{ height: [8, 40, 8] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                          style={{ width: 4, background: 'white', borderRadius: 2 }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Volume2 size={48} />
                  )}
                </motion.button>
                <p style={{ fontSize: 14, color: '#5a6b8c', margin: 0, fontWeight: 500 }}>
                  {playing === q.play_audio ? '🔊 Playing...' : 'Tap to hear the word'}
                </p>
              </div>

              <h2 style={{
                fontFamily: 'Manrope', fontSize: '1.4rem', fontWeight: 800,
                color: '#102a56', marginBottom: 24, textAlign: 'center',
              }}>
                Which word did you hear?
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600, margin: '0 auto' }}>
                {['a', 'b'].map((opt) => {
                  const word = opt === 'a' ? q.option_a : q.option_b;
                  const isSelected = answered === opt;
                  return (
                    <motion.button
                      key={opt}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectAnswer(opt)}
                      disabled={!!answered}
                      style={{
                        padding: 24,
                        borderRadius: 16,
                        fontSize: 22,
                        fontWeight: 800,
                        fontFamily: 'Manrope',
                        background: isSelected
                          ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                          : 'white',
                        color: isSelected ? 'white' : '#102a56',
                        border: isSelected ? '2px solid #a855f7' : '2px solid #e8f0fe',
                        cursor: answered ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 8px 24px rgba(168, 85, 247, 0.3)' : 'none',
                      }}
                    >
                      {word}
                    </motion.button>
                  );
                })}
              </div>

              {/* Submit button */}
              {Object.keys(answers).length === game.questions.length && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={submitTest}
                  disabled={loading}
                  style={{
                    display: 'block',
                    margin: '32px auto 0',
                    padding: '14px 40px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 700,
                    border: 'none',
                    cursor: loading ? 'wait' : 'pointer',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {loading ? <><Loader size={18} /> Analyzing...</> : <><CheckCircle size={18} /> Submit to AI</>}
                </motion.button>
              )}
            </motion.div>
          )}

          {/* ===================== RESULTS STAGE ===================== */}
          {stage === 'results' && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Big accuracy card */}
              <div style={{
                background: result.accuracy >= 70
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : result.accuracy >= 50
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                borderRadius: 24,
                padding: 40,
                marginBottom: 24,
                color: 'white',
                textAlign: 'center',
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ fontSize: 60, marginBottom: 12 }}
                >
                  {result.accuracy >= 70 ? '🏆' : result.accuracy >= 50 ? '👍' : '💪'}
                </motion.div>
                <h2 style={{
                  fontFamily: 'Manrope', fontSize: '3.5rem', fontWeight: 800,
                  color: 'white', margin: 0, lineHeight: 1,
                }}>
                  {result.accuracy}%
                </h2>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.95)', marginTop: 8, marginBottom: 4 }}>
                  {result.correct} out of {result.total} correct
                </p>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', margin: 0, fontWeight: 500 }}>
                  {result.ai_feedback}
                </p>
              </div>

              {/* Per-question breakdown */}
              <div style={{
                background: 'white', borderRadius: 20, padding: 28,
                border: '1px solid #e8f0fe', marginBottom: 24,
              }}>
                <h3 style={{
                  fontFamily: 'Manrope', fontSize: '1.1rem', fontWeight: 800,
                  color: '#102a56', marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <BarChart3 size={20} color="#1e6ef5" /> Question Breakdown
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.results.map((r, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: 14, borderRadius: 10,
                        background: r.is_correct ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${r.is_correct ? '#d1fae5' : '#fecaca'}`,
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: r.is_correct ? '#10b981' : '#ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: 14,
                      }}>
                        {r.question_id}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#102a56' }}>
                          {r.sound_contrast}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 13, fontWeight: 700,
                        color: r.is_correct ? '#10b981' : '#ef4444',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        {r.is_correct ? (
                          <><CheckCircle size={16} /> Correct</>
                        ) : (
                          <><XCircle size={16} /> Answer: {String(r.correct_answer).toUpperCase()}</>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={reset}
                  style={{
                    padding: '14px 28px',
                    background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                    color: 'white',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(168, 85, 247, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <RefreshCw size={18} /> Generate New Test
                </motion.button>
                <Link
                  to="/dashboard"
                  style={{
                    padding: '14px 28px',
                    background: 'white',
                    color: '#102a56',
                    border: '2px solid #e8f0fe',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <ArrowRight size={18} /> Back to Dashboard
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}