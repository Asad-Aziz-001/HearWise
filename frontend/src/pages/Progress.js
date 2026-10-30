import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target, Clock, CheckCircle2, Star, ChevronDown, Calendar,
  RefreshCw, TrendingUp, Gamepad2, BarChart3
} from 'lucide-react';
import {
  LineChart, Line, XAxis, Tooltip, ResponsiveContainer, YAxis,
  PieChart, Pie, Cell, CartesianGrid, BarChart, Bar
} from 'recharts';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const GAME_INFO = {
  similar: { name: 'Similar Sounds', emoji: '🎧', color: '#1e6ef5' },
  sequence: { name: 'Sequence Memory', emoji: '🧠', color: '#10b981' },
  tone_discrimination: { name: 'Tone', emoji: '🎵', color: '#a855f7' },
  rhyme_match: { name: 'Rhyme', emoji: '🎼', color: '#f59e0b' },
  word_position: { name: 'Word Position', emoji: '📍', color: '#0ea5e9' },
  word_chain_memory: { name: 'Chain', emoji: '🔗', color: '#8b5cf6' },
  phoneme_replacement: { name: 'Phoneme', emoji: '🔤', color: '#ec4899' },
  audio_story: { name: 'Story', emoji: '📖', color: '#14b8a6' },
  pronunciation: { name: 'Pronunciation', emoji: '🎤', color: '#f97316' },
  emotion_detection: { name: 'Emotion', emoji: '😊', color: '#eab308' },
  word_in_noise: { name: 'Noise', emoji: '🎯', color: '#6366f1' },
  word_discrimination: { name: 'Similar', emoji: '🎧', color: '#1e6ef5' },
  sequence_memory: { name: 'Sequence', emoji: '🧠', color: '#10b981' },
};

function getLocalDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildWeekly(history) {
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({ day: DAYS[d.getDay()], key: getLocalDateKey(d), acc: [] });
  }
  (history || []).forEach(s => {
    const m = days.find(d => d.key === s.date);
    if (m) m.acc.push(s.accuracy);
  });
  return days.map(d => ({
    day: d.day,
    accuracy: d.acc.length ? Math.round(d.acc.reduce((a, b) => a + b, 0) / d.acc.length) : 0,
  }));
}

export default function Progress() {
  const [progress, setProgress] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState('Last 7 days');

  const load = async (spin = false) => {
    if (spin) setRefreshing(true);
    try {
      const [p, pr] = await Promise.all([
        api.get('/dashboard/progress').then(r => r.data).catch(() => null),
        api.get('/analytics/ai-prediction').then(r => r.data).catch(() => null),
      ]);
      setProgress(p);
      setPrediction(pr);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const history = progress?.history || [];
  const weak = progress?.weak_areas || [];
  const soundPerf = progress?.sound_performance || [];
  const perGame = progress?.per_game || {};

  const overall = history.length
    ? Math.round(history.reduce((s, h) => s + h.accuracy, 0) / history.length)
    : 0;

  const meanRT = soundPerf.length
    ? (soundPerf.reduce((s, p) => s + p.avg_response_time, 0) / soundPerf.length / 1000).toFixed(1)
    : '0.0';

  const totalAttempts = soundPerf.reduce((s, p) => s + p.attempts, 0);
  const totalPoints = history.length * 50 + overall;
  const level = Math.min(5, Math.floor(totalPoints / 300) + 1);

  const weekly = buildWeekly(history);

  // Per-game bar data
  const gameBarData = Object.entries(perGame)
    .filter(([_, data]) => data.sessions > 0)
    .map(([gt, data]) => ({
      game: (GAME_INFO[gt]?.emoji || '🎮') + ' ' + (GAME_INFO[gt]?.name || gt),
      accuracy: data.accuracy,
      sessions: data.sessions,
      color: GAME_INFO[gt]?.color || '#5a6b8c',
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  // Confused pairs
  const confused = weak.slice(0, 5).map((w, i) => ({
    pair: w.sound_contrast,
    pct: Math.round(100 - w.accuracy),
    color: ['#1e6ef5', '#a855f7', '#ef4444', '#f59e0b', '#34d399'][i % 5],
  }));

  // Game pie
  const pieData = gameBarData.slice(0, 5).map(g => ({
    name: g.game,
    value: g.accuracy || 1,
    color: g.color,
  }));

  // Prediction chart
  let predictionChart = [];
  if (prediction?.prediction_available) {
    predictionChart = [
      ...prediction.history.map(h => ({ session: h.session, actual: h.accuracy, projected: null })),
      ...prediction.projected.map(p => ({ session: p.session, actual: null, projected: p.accuracy })),
    ];
  }

  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-main">
        <div className="dash-topbar">
          <div>
            <h1 className="dash-greeting" style={{ fontSize: '1.6rem' }}>Progress & Predictions</h1>
            <p className="dash-subtext" style={{ marginBottom: 0 }}>
              Detailed breakdown of all 11 games
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'white', border: '1px solid #e8f0fe',
                color: '#5a6b8c', fontSize: 13, cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button
              onClick={() => setRange(range === 'Last 7 days' ? 'Last 30 days' : 'Last 7 days')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 10,
                background: 'white', border: '1px solid #e8f0fe',
                color: '#102a56', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Calendar size={14} /> {range} <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {loading ? <p>Loading...</p> : (
          <>
            {/* Stats */}
            <div className="dash-stats-grid">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="dash-stat-card">
                <div className="dash-stat-header">
                  <div className="dash-stat-label">Overall Accuracy</div>
                  <div className="dash-stat-icon green"><Target size={16} /></div>
                </div>
                <div className="dash-stat-value">{overall}%</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="dash-stat-card">
                <div className="dash-stat-header">
                  <div className="dash-stat-label">Mean Response Time</div>
                  <div className="dash-stat-icon blue"><Clock size={16} /></div>
                </div>
                <div className="dash-stat-value">{meanRT}s</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="dash-stat-card">
                <div className="dash-stat-header">
                  <div className="dash-stat-label">Total Attempts</div>
                  <div className="dash-stat-icon green"><CheckCircle2 size={16} /></div>
                </div>
                <div className="dash-stat-value">{totalAttempts}</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="dash-stat-card">
                <div className="dash-stat-header">
                  <div className="dash-stat-label">Current Level</div>
                  <div className="dash-stat-icon yellow"><Star size={16} /></div>
                </div>
                <div className="dash-stat-value">{level}</div>
              </motion.div>
            </div>

            {/* Prediction stats */}
            {prediction?.prediction_available && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: 16, padding: 20, borderLeft: '4px solid #0ea5e9' }}>
                  <div style={{ fontSize: 13, color: '#0369a1', fontWeight: 600, marginBottom: 6 }}>Current Accuracy</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#0369a1' }}>{prediction.current_accuracy}%</div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: 16, padding: 20, borderLeft: '4px solid #10b981' }}>
                  <div style={{ fontSize: 13, color: '#059669', fontWeight: 600, marginBottom: 6 }}>Trend</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', textTransform: 'capitalize' }}>
                    {prediction.trend === 'improving' ? '📈 Improving' : prediction.trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderRadius: 16, padding: 20, borderLeft: '4px solid #a855f7' }}>
                  <div style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600, marginBottom: 6 }}>To Reach 80%</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed' }}>
                    {prediction.sessions_to_80 > 0 ? prediction.sessions_to_80 : '—'}
                  </div>
                </motion.div>
              </div>
            )}

            {/* 3-Column Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="dash-progress-card">
                <h3 className="dash-progress-title" style={{ marginBottom: 16 }}>Accuracy Trend</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={weekly} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} interval={0} padding={{ left: 10, right: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={40} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }} formatter={v => [`${v}%`, 'Accuracy']} />
                    <Line type="monotone" dataKey="accuracy" stroke="#1e6ef5" strokeWidth={2.5} dot={{ r: 4, fill: '#1e6ef5', stroke: '#fff', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="dash-progress-card">
                <h3 className="dash-progress-title" style={{ marginBottom: 16, fontSize: '0.95rem' }}>Confused Pairs</h3>
                {confused.length === 0 ? <p style={{ fontSize: 13, color: '#8a9ab5' }}>No data yet.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {confused.map((c, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: '#102a56', fontWeight: 500 }}>{c.pair}</span>
                          <span style={{ color: c.color, fontWeight: 700 }}>{c.pct}%</span>
                        </div>
                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${c.pct}%`, background: c.color, borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="dash-progress-card">
                <h3 className="dash-progress-title" style={{ marginBottom: 16, fontSize: '0.95rem' }}>Top 5 Games</h3>
                {pieData.length === 0 ? <p style={{ fontSize: 13, color: '#8a9ab5' }}>No games yet.</p> : (
                  <>
                    <div style={{ position: 'relative', height: 160 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={65} startAngle={90} endAngle={-270} paddingAngle={2} stroke="none">
                            {pieData.map((g, i) => <Cell key={i} fill={g.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#102a56' }}>{overall}%</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {pieData.map((g, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#5a6b8c', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ width: 8, height: 8, borderRadius: 4, background: g.color, display: 'inline-block', flexShrink: 0 }} />
                            {g.name}
                          </span>
                          <span style={{ fontWeight: 700, color: '#102a56' }}>{g.value}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            </div>

            {/* ✅ Per-Game Bar Chart */}
            {gameBarData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="dash-progress-card" style={{ marginBottom: 24 }}>
                <h3 className="dash-progress-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Gamepad2 size={20} color="#10b981" /> Per-Game Accuracy Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={Math.max(220, gameBarData.length * 40)}>
                  <BarChart data={gameBarData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 140 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <YAxis dataKey="game" type="category" tick={{ fontSize: 11, fill: '#102a56' }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }} formatter={(v) => [`${v}%`, 'Accuracy']} />
                    <Bar dataKey="accuracy" radius={[0, 6, 6, 0]}>
                      {gameBarData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* ✅ Per-Game Detail Cards */}
            {Object.keys(perGame).length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="dash-progress-card" style={{ marginBottom: 24 }}>
                <h3 className="dash-progress-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart3 size={20} color="#a855f7" /> All Games Breakdown
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                  {Object.entries(perGame)
                    .sort(([_, a], [__, b]) => b.accuracy - a.accuracy)
                    .map(([gt, data]) => {
                      const info = GAME_INFO[gt] || { name: gt, emoji: '🎮', color: '#5a6b8c' };
                      const accColor = data.accuracy >= 70 ? '#10b981' : data.accuracy >= 50 ? '#f59e0b' : '#ef4444';
                      return (
                        <div key={gt} style={{
                          padding: 16,
                          background: 'white',
                          borderRadius: 12,
                          border: '2px solid #e8f0fe',
                          borderLeft: `4px solid ${info.color}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 22 }}>{info.emoji}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#102a56', flex: 1 }}>{info.name}</span>
                          </div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: accColor, marginBottom: 4 }}>
                            {data.accuracy}%
                          </div>
                          <div style={{ fontSize: 11, color: '#5a6b8c', marginBottom: 8 }}>
                            {data.sessions} session{data.sessions !== 1 ? 's' : ''} · {data.total_questions} Qs
                          </div>
                          <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${data.accuracy}%`, background: info.color, borderRadius: 3 }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            )}

            {/* Prediction Chart */}
            {prediction?.prediction_available && predictionChart.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="dash-progress-card" style={{ marginBottom: 24 }}>
                <h3 className="dash-progress-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={18} color="#10b981" /> Learning Curve & AI Projection
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={predictionChart} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="session" tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }} />
                    <Line type="monotone" dataKey="actual" stroke="#1e6ef5" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                    <Line type="monotone" dataKey="projected" stroke="#a855f7" strokeWidth={3} strokeDasharray="6 4" dot={{ r: 4 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Weak Areas */}
            {weak.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="dash-weak-card">
                <h3 className="dash-progress-title" style={{ marginBottom: 16 }}>Areas Needing Practice</h3>
                <div className="dash-weak-list">
                  {weak.slice(0, 5).map((w, i) => {
                    const acc = w.accuracy;
                    const fill = acc < 50 ? '#ef4444' : acc < 70 ? '#f59e0b' : '#10b981';
                    return (
                      <div key={i} className="dash-weak-item">
                        <div className="dash-weak-top">
                          <span className="dash-weak-name">{w.sound_contrast}</span>
                          <span className={`dash-weak-acc ${acc < 50 ? 'low' : acc < 70 ? 'mid' : 'high'}`}>{acc}%</span>
                        </div>
                        <div className="dash-weak-bar">
                          <div className="dash-weak-fill" style={{ width: `${acc}%`, background: fill }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    </div>
  );
}