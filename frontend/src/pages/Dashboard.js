import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Target, Clock, Star, Trophy, ChevronDown, RefreshCw,
  TrendingUp, Activity, Zap, Flame, BarChart3, Gamepad2,
  Headphones, Music, Mic, BookOpen, Smile, Waves, Link as LinkIcon,
  MapPin, Repeat, Sparkles, Brain
} from 'lucide-react';
import {
  PieChart, Pie, Cell, XAxis, Tooltip, ResponsiveContainer, YAxis,
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import Sidebar from '../components/Sidebar';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const GAME_INFO = {
  similar: { name: 'Similar Sounds', icon: Headphones, color: '#1e6ef5', emoji: '🎧' },
  sequence: { name: 'Sequence Memory', icon: BarChart3, color: '#10b981', emoji: '🧠' },
  tone_discrimination: { name: 'Tone Discrimination', icon: Music, color: '#a855f7', emoji: '🎵' },
  rhyme_match: { name: 'Rhyme Match', icon: Repeat, color: '#f59e0b', emoji: '🎼' },
  word_position: { name: 'Word Position', icon: MapPin, color: '#0ea5e9', emoji: '📍' },
  word_chain_memory: { name: 'Word Chain', icon: LinkIcon, color: '#8b5cf6', emoji: '🔗' },
  phoneme_replacement: { name: 'Phoneme', icon: Sparkles, color: '#ec4899', emoji: '🔤' },
  audio_story: { name: 'Audio Story', icon: BookOpen, color: '#14b8a6', emoji: '📖' },
  pronunciation: { name: 'Pronunciation', icon: Mic, color: '#f97316', emoji: '🎤' },
  emotion_detection: { name: 'Emotion', icon: Smile, color: '#eab308', emoji: '😊' },
  word_in_noise: { name: 'Word in Noise', icon: Waves, color: '#6366f1', emoji: '🎯' },
  // Legacy
  word_discrimination: { name: 'Similar Sounds', icon: Headphones, color: '#1e6ef5', emoji: '🎧' },
  sequence_memory: { name: 'Sequence Memory', icon: BarChart3, color: '#10b981', emoji: '🧠' },
};

function getLocalDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildWeeklyData(history) {
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({
      day: DAYS[d.getDay()],
      key: getLocalDateKey(d),
      accuracies: [],
      isToday: i === 0,
    });
  }
  (history || []).forEach((session) => {
    if (!session?.date) return;
    const match = days.find((d) => d.key === session.date);
    if (match) match.accuracies.push(session.accuracy);
  });
  return days.map((d) => ({
    day: d.day,
    date: d.key,
    accuracy: d.accuracies.length
      ? Math.round(d.accuracies.reduce((a, b) => a + b, 0) / d.accuracies.length)
      : 0,
    sessions: d.accuracies.length,
    isToday: d.isToday,
  }));
}

export default function Dashboard() {
  const user = getUser();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadData = useCallback(async (showLoader = false) => {
    if (showLoader) setRefreshing(true);
    try {
      const p = await api.get('/dashboard/progress')
        .then((res) => res.data)
        .catch(() => null);
      setProgress(p);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadData]);

  const history = progress?.history || [];
  const weakAreas = progress?.weak_areas || [];
  const soundPerf = progress?.sound_performance || [];
  const perGame = progress?.per_game || {};

  const overallAccuracy = history.length
    ? Math.round(history.reduce((s, h) => s + h.accuracy, 0) / history.length)
    : 0;

  const meanResponseTime = soundPerf.length
    ? (soundPerf.reduce((s, p) => s + p.avg_response_time, 0) / soundPerf.length / 1000).toFixed(1)
    : '0.0';

  const totalPoints = history.length * 50 + overallAccuracy;
  const currentLevel = Math.min(5, Math.floor(totalPoints / 300) + 1);

  const weeklyData = buildWeeklyData(history);
  
  // Radar data for sound contrasts
  const radarData = (soundPerf || []).slice(0, 6).map(s => ({
    contrast: s.contrast,
    accuracy: s.accuracy || 0,
  }));

  // Per-game bar chart data
  const gameBarData = Object.entries(perGame)
    .filter(([_, data]) => data.sessions > 0)
    .map(([gt, data]) => ({
      game: GAME_INFO[gt]?.emoji + ' ' + (GAME_INFO[gt]?.name || gt),
      accuracy: data.accuracy,
      sessions: data.sessions,
      color: GAME_INFO[gt]?.color || '#5a6b8c',
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  const pieData = [
    { name: 'Correct', value: overallAccuracy },
    { name: 'Incorrect', value: 100 - overallAccuracy },
  ];
  const PIE_COLORS = ['#1e6ef5', '#e8f0fe'];

  if (loading) {
    return (
      <div className="dash-layout">
        <aside className="dash-sidebar">
          <Link to="/" className="dash-sidebar-logo">
            <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
              <path d="M14 20V28M10 22V26M18 17V31M22 14V34M26 12V36M30 16V32M34 20V28M38 22V26"
                    stroke="#1e6ef5" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className="dash-sidebar-logo-text">HearWise</span>
          </Link>
        </aside>
        <main className="dash-main"><p>Loading dashboard...</p></main>
      </div>
    );
  }

  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-main">
        {/* Topbar */}
        <div className="dash-topbar">
          <div>
            <h1 className="dash-greeting">Hello, {user?.username || 'User'}! 👋</h1>
            <p className="dash-subtext">
              Track your listening performance across 11 games.
              <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>
                (Updated {lastUpdated.toLocaleTimeString()})
              </span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 10,
                background: 'white', border: '1px solid #e8f0fe',
                color: '#5a6b8c', fontSize: 13, fontWeight: 600,
                cursor: refreshing ? 'wait' : 'pointer',
              }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <div className="dash-user-pill">
              <div className="dash-avatar">{(user?.username || 'U').charAt(0).toUpperCase()}</div>
              <div className="dash-user-info">
                <span className="dash-user-name">{user?.username || 'Guest'}</span>
                <span className="dash-user-role">{user?.role === 'admin' ? 'Admin' : 'Learner'}</span>
              </div>
              <ChevronDown size={16} style={{ color: '#9ca3af' }} />
            </div>
          </div>
        </div>

        {history.length === 0 && (
          <div style={{
            padding: 12, marginBottom: 16, borderRadius: 10,
            background: '#fef3c7', border: '1px solid #fbbf24',
            fontSize: 13, color: '#92400e',
          }}>
            ⚠️ <strong>No sessions found.</strong> Play a game to see analytics.
            <Link to="/games" style={{ marginLeft: 8, fontWeight: 700, color: '#92400e' }}>Go to Games →</Link>
          </div>
        )}

        {/* Stats */}
        <div className="dash-stats-grid">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="dash-stat-card">
            <div className="dash-stat-header">
              <div className="dash-stat-label">Overall Accuracy</div>
              <div className="dash-stat-icon green"><Target size={16} /></div>
            </div>
            <div className="dash-stat-value">{overallAccuracy}%</div>
            <div className={`dash-stat-trend ${overallAccuracy >= 70 ? 'up' : 'down'}`}>
              {overallAccuracy >= 70 ? '↑' : '↓'} {Math.abs(overallAccuracy - 70)}% vs target
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="dash-stat-card">
            <div className="dash-stat-header">
              <div className="dash-stat-label">Games Played</div>
              <div className="dash-stat-icon blue"><Gamepad2 size={16} /></div>
            </div>
            <div className="dash-stat-value">{Object.keys(perGame).length}</div>
            <div className="dash-stat-trend up">Total Games</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="dash-stat-card">
            <div className="dash-stat-header">
              <div className="dash-stat-label">Current Level</div>
              <div className="dash-stat-icon yellow"><Star size={16} /></div>
            </div>
            <div className="dash-stat-value">{currentLevel}</div>
            <div className="dash-stat-trend up">↑ Level up</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="dash-stat-card">
            <div className="dash-stat-header">
              <div className="dash-stat-label">Total Sessions</div>
              <div className="dash-stat-icon purple"><Trophy size={16} /></div>
            </div>
            <div className="dash-stat-value">{history.length}</div>
            <div className="dash-stat-trend up">↑ Keep going</div>
          </motion.div>
        </div>

        {/* Row 1: Donut + Line */}
        <div className="dash-content-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="dash-progress-card">
            <h3 className="dash-progress-title" style={{ marginBottom: 12 }}>Overall Accuracy</h3>
            <div className="dash-ring-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={75} startAngle={90} endAngle={-270} stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="dash-ring-center">
                <div className="dash-ring-value">{overallAccuracy}%</div>
                <div className="dash-ring-label">of {history.length} sessions</div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="dash-progress-card">
            <h3 className="dash-progress-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="#1e6ef5" /> Weekly Accuracy Trend
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} interval={0} padding={{ left: 10, right: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={35} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }} formatter={(v) => [`${v}%`, 'Accuracy']} />
                <Line type="monotone" dataKey="accuracy" stroke="#1e6ef5" strokeWidth={3} dot={{ r: 5, fill: '#1e6ef5', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* ✅ NEW: Per-Game Performance Bar Chart */}
        {gameBarData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="dash-progress-card" style={{ marginTop: 24 }}>
            <h3 className="dash-progress-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Gamepad2 size={20} color="#10b981" /> Per-Game Accuracy
            </h3>
            <ResponsiveContainer width="100%" height={Math.max(200, gameBarData.length * 40)}>
              <BarChart data={gameBarData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 140 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="game" type="category" tick={{ fontSize: 12, fill: '#102a56' }} axisLine={false} tickLine={false} width={130} />
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

        {/* Row 2: Radar + Weak Areas */}
        <div className="dash-content-grid" style={{ marginTop: 24 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="dash-progress-card">
            <h3 className="dash-progress-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} color="#a855f7" /> Sound Contrast Strengths
            </h3>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e8f0fe" />
                  <PolarAngleAxis dataKey="contrast" tick={{ fontSize: 10, fill: '#5a6b8c' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#8a9ab5' }} />
                  <Radar name="Accuracy" dataKey="accuracy" stroke="#a855f7" fill="#a855f7" fillOpacity={0.35} strokeWidth={2} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }} formatter={(v) => [`${v}%`, 'Accuracy']} />
                </RadarChart>
              </ResponsiveContainer>
            ) : <p style={{ fontSize: 13, color: '#8a9ab5', textAlign: 'center', padding: 40 }}>Play more sessions to see strengths.</p>}
          </motion.div>

          {weakAreas.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="dash-weak-card">
              <h3 className="dash-progress-title" style={{ marginBottom: 16 }}>🎯 Areas Needing Practice</h3>
              <div className="dash-weak-list">
                {weakAreas.slice(0, 5).map((w, i) => {
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
        </div>

        {/* Row 3: Area Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="dash-progress-card" style={{ marginTop: 24 }}>
          <h3 className="dash-progress-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="#1e6ef5" /> Performance Overview
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weeklyData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e6ef5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#1e6ef5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} interval={0} padding={{ left: 10, right: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={35} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }} formatter={(v) => [`${v}%`, 'Accuracy']} />
              <Area type="monotone" dataKey="accuracy" stroke="#1e6ef5" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* ✅ NEW: Games Played List */}
        {Object.keys(perGame).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="dash-progress-card" style={{ marginTop: 24 }}>
            <h3 className="dash-progress-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Gamepad2 size={20} color="#a855f7" /> Games You've Played
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {Object.entries(perGame)
                .sort(([_, a], [__, b]) => b.accuracy - a.accuracy)
                .map(([gt, data]) => {
                  const info = GAME_INFO[gt] || { name: gt, emoji: '🎮', color: '#5a6b8c' };
                  const accColor = data.accuracy >= 70 ? '#10b981' : data.accuracy >= 50 ? '#f59e0b' : '#ef4444';
                  return (
                    <div key={gt} style={{
                      padding: 16,
                      background: '#f8faff',
                      borderRadius: 12,
                      border: '1px solid #e8f0fe',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 8,
                      }}>
                        <span style={{ fontSize: 24 }}>{info.emoji}</span>
                        <span style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#102a56',
                          flex: 1,
                        }}>
                          {info.name}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: accColor,
                        marginBottom: 4,
                      }}>
                        {data.accuracy}%
                      </div>
                      <div style={{ fontSize: 11, color: '#5a6b8c' }}>
                        {data.sessions} session{data.sessions !== 1 ? 's' : ''} · {data.total_questions} Qs
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    </div>
  );
}