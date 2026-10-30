import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, Loader, Target, Clock, Trophy,
  Activity, TrendingUp, Zap, Star, CheckCircle2, BarChart3,
  Flame, Brain, Calendar
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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

export default function ReportPage() {
  const [progress, setProgress] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [focusTime, setFocusTime] = useState(null);
  const [aiStats, setAiStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/progress').then(r => r.data).catch(() => null),
      api.get('/analytics/ai-prediction').then(r => r.data).catch(() => null),
      api.get('/analytics/heatmap').then(r => r.data).catch(() => null),
      api.get('/analytics/focus-time').then(r => r.data).catch(() => null),
      api.get('/ai/stats').then(r => r.data).catch(() => null),
    ]).then(([p, pr, a, f, ai]) => {
      setProgress(p);
      setPrediction(pr);
      setAnalytics(a);
      setFocusTime(f);
      setAiStats(ai);
      setLoading(false);
    });
  }, []);

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/report/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `hearwise_full_report_${timestamp}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('📄 Full PDF report downloaded!');
    } catch (err) {
      toast.error('Could not download report');
    } finally {
      setDownloading(false);
    }
  };

  // ============ DERIVED ============
  const history = progress?.history || [];
  const weak = progress?.weak_areas || [];
  const soundPerf = progress?.sound_performance || [];

  const overall = history.length
    ? Math.round(history.reduce((s, h) => s + h.accuracy, 0) / history.length) : 0;

  const meanRT = soundPerf.length
    ? (soundPerf.reduce((s, p) => s + p.avg_response_time, 0) / soundPerf.length / 1000).toFixed(1)
    : '0.0';

  const totalAttempts = soundPerf.reduce((s, p) => s + p.attempts, 0);
  const totalPoints = history.length * 50 + overall;
  const level = Math.min(5, Math.floor(totalPoints / 300) + 1);

  const weekly = buildWeekly(history);
  const radarData = (soundPerf || []).slice(0, 6).map(s => ({
    contrast: s.contrast,
    accuracy: s.accuracy || 0,
  }));

  const wordGameHistory = history.filter(h => h.game_type === 'word_discrimination');
  const seqGameHistory = history.filter(h => h.game_type === 'sequence_memory');
  const wordGameAcc = wordGameHistory.length
    ? Math.round(wordGameHistory.reduce((s, h) => s + h.accuracy, 0) / wordGameHistory.length) : 0;
  const seqGameAcc = seqGameHistory.length
    ? Math.round(seqGameHistory.reduce((s, h) => s + h.accuracy, 0) / seqGameHistory.length) : 0;

  const gamePie = [
    { name: 'Similar Words', value: wordGameAcc || 1, color: '#1e6ef5' },
    { name: 'Sequence Memory', value: seqGameAcc || 1, color: '#93c5fd' },
  ];

  const sessionData = history.slice(-10).map((h, i) => ({
    session: i + 1,
    accuracy: h.accuracy || 0,
    date: h.date,
  }));

  let predictionChart = [];
  if (prediction?.prediction_available) {
    predictionChart = [
      ...prediction.history.map(h => ({ session: h.session, actual: h.accuracy, projected: null })),
      ...prediction.projected.map(p => ({ session: p.session, actual: null, projected: p.accuracy })),
    ];
  }

  const diffCount = { easy: 0, medium: 0, hard: 0 };
  history.forEach(h => { if (h.difficulty && diffCount[h.difficulty] !== undefined) diffCount[h.difficulty]++; });
  const diffPie = [
    { name: 'Easy', value: diffCount.easy, color: '#34d399' },
    { name: 'Medium', value: diffCount.medium, color: '#f59e0b' },
    { name: 'Hard', value: diffCount.hard, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // ============ HEATMAP WEEK BUILD ============
  const heatmapWeeks = [];
  if (analytics?.days) {
    let week = [];
    analytics.days.forEach((day, i) => {
      week.push(day);
      if (week.length === 7 || i === analytics.days.length - 1) {
        heatmapWeeks.push(week);
        week = [];
      }
    });
  }

  const getHeatColor = (count) => {
    if (count === 0) return '#ebedf0';
    if (count === 1) return '#c6e48b';
    if (count === 2) return '#7bc96f';
    if (count === 3) return '#239a3b';
    return '#196127';
  };

  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-main">
        {/* Topbar */}
        <div className="dash-topbar">
          <div>
            <h1 className="dash-greeting" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={28} color="#1e6ef5" /> Complete Report
            </h1>
            <p className="dash-subtext">
              Full performance analysis with charts, graphs, and AI insights.
            </p>
          </div>
          <button
            onClick={downloadPDF}
            disabled={downloading}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 28px', borderRadius: 12,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white', border: 'none', fontSize: 15, fontWeight: 700,
              cursor: downloading ? 'wait' : 'pointer',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
            }}
          >
            {downloading ? (
              <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating PDF...</>
            ) : (
              <><Download size={18} /> Download Full PDF Report</>
            )}
          </button>
        </div>

        {loading ? <p>Loading complete report...</p> : (
          <>
            {/* ===== SUMMARY STATS ===== */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dash-progress-card" style={{ marginBottom: 24 }}>
              <h2 className="dash-section-title" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={22} color="#1e6ef5" /> Performance Summary
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <div style={{ padding: 20, background: '#f0fdf4', borderRadius: 12, borderLeft: '4px solid #10b981' }}>
                  <div style={{ fontSize: 13, color: '#059669', fontWeight: 600, marginBottom: 6 }}>Overall Accuracy</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#059669' }}>{overall}%</div>
                </div>
                <div style={{ padding: 20, background: '#f0f9ff', borderRadius: 12, borderLeft: '4px solid #0ea5e9' }}>
                  <div style={{ fontSize: 13, color: '#0369a1', fontWeight: 600, marginBottom: 6 }}>Total Sessions</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#0369a1' }}>{history.length}</div>
                </div>
                <div style={{ padding: 20, background: '#f0f9ff', borderRadius: 12, borderLeft: '4px solid #0ea5e9' }}>
                  <div style={{ fontSize: 13, color: '#0369a1', fontWeight: 600, marginBottom: 6 }}>Mean Response Time</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#0369a1' }}>{meanRT}s</div>
                </div>
                <div style={{ padding: 20, background: '#f5f3ff', borderRadius: 12, borderLeft: '4px solid #a855f7' }}>
                  <div style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600, marginBottom: 6 }}>Current Level</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#7c3aed' }}>{level}</div>
                </div>
              </div>
            </motion.div>

            {/* ===== AI STATS ===== */}
            {aiStats && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="dash-progress-card" style={{ marginBottom: 24 }}>
                <h2 className="dash-section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Brain size={20} color="#a855f7" /> AI Practice Stats
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  <div style={{ padding: 20, background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderRadius: 12 }}>
                    <div style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600, marginBottom: 6 }}>AI Games Played</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed' }}>{aiStats.total_ai_sessions}</div>
                  </div>
                  <div style={{ padding: 20, background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: 12 }}>
                    <div style={{ fontSize: 13, color: '#0369a1', fontWeight: 600, marginBottom: 6 }}>Total AI Attempts</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#0369a1' }}>{aiStats.total_ai_attempts}</div>
                  </div>
                  <div style={{ padding: 20, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: 12 }}>
                    <div style={{ fontSize: 13, color: '#059669', fontWeight: 600, marginBottom: 6 }}>AI Accuracy</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>{aiStats.avg_accuracy}%</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ===== WEEKLY TREND ===== */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="dash-progress-card" style={{ marginBottom: 24 }}>
              <h2 className="dash-section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={20} color="#1e6ef5" /> Weekly Accuracy Trend
              </h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={weekly} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }} formatter={v => [`${v}%`, 'Accuracy']} />
                  <Line type="monotone" dataKey="accuracy" stroke="#1e6ef5" strokeWidth={3} dot={{ r: 5, fill: '#1e6ef5', stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* ===== RADAR + SESSIONS ===== */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="dash-progress-card">
                <h2 className="dash-section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={20} color="#a855f7" /> Sound Contrast Strengths
                </h2>
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e8f0fe" />
                      <PolarAngleAxis dataKey="contrast" tick={{ fontSize: 10, fill: '#5a6b8c' }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#8a9ab5' }} />
                      <Radar name="Accuracy" dataKey="accuracy" stroke="#a855f7" fill="#a855f7" fillOpacity={0.35} strokeWidth={2} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : <p style={{ fontSize: 13, color: '#8a9ab5', textAlign: 'center', padding: 40 }}>No data yet.</p>}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="dash-progress-card">
                <h2 className="dash-section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart3 size={20} color="#10b981" /> Last 10 Sessions
                </h2>
                {sessionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={sessionData}>
                      <XAxis dataKey="session" tick={{ fontSize: 10, fill: '#8a9ab5' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#8a9ab5' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }} />
                      <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                        {sessionData.map((entry, i) => (
                          <Cell key={i} fill={entry.accuracy >= 80 ? '#10b981' : entry.accuracy >= 50 ? '#f59e0b' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p style={{ fontSize: 13, color: '#8a9ab5', textAlign: 'center', padding: 40 }}>No sessions yet.</p>}
              </motion.div>
            </div>

            {/* ===== HEATMAP ===== */}
            {analytics?.days && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="dash-progress-card" style={{ marginBottom: 24 }}>
                <h2 className="dash-section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Flame size={20} color="#f59e0b" /> Activity Heatmap (Last 60 Days)
                </h2>
                <div style={{ display: 'flex', gap: 3 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 4 }}>
                    {DAYS_SHORT.map((d, i) => (
                      <div key={i} style={{ fontSize: 10, color: '#8a9ab5', height: 14, lineHeight: '14px' }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 3, flex: 1, overflowX: 'auto' }}>
                    {heatmapWeeks.map((week, wi) => (
                      <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {week.map((day, di) => (
                          <div
                            key={di}
                            title={`${day.date}: ${day.count} sessions`}
                            style={{
                              width: 14, height: 14, borderRadius: 3,
                              background: getHeatColor(day.count), cursor: 'pointer',
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11, color: '#8a9ab5' }}>
                  <span>Less</span>
                  {['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'].map((c, i) => (
                    <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
                  ))}
                  <span>More</span>
                </div>
              </motion.div>
            )}

            {/* ===== FOCUS TIME ===== */}
            {focusTime?.by_day && focusTime.by_day.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="dash-progress-card" style={{ marginBottom: 24 }}>
                <h2 className="dash-section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={20} color="#a855f7" /> Focus Time (Last 14 Days)
                </h2>
                <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#5a6b8c' }}>Total Focus Time</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#102a56' }}>{focusTime.total_minutes} min</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#5a6b8c' }}>Avg / Session</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#a855f7' }}>{focusTime.avg_per_session} min</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={focusTime.by_day.map(d => ({ ...d, day: d.date.slice(-5) }))}>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8a9ab5' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#8a9ab5' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}m`} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }} />
                    <Bar dataKey="minutes" fill="#a855f7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* ===== AI PREDICTION ===== */}
            {prediction?.prediction_available && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="dash-progress-card" style={{ marginBottom: 24 }}>
                <h2 className="dash-section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={20} color="#f59e0b" /> AI Learning Curve Prediction
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                  <div style={{ padding: 16, background: '#f0f9ff', borderRadius: 12 }}>
                    <div style={{ fontSize: 12, color: '#0369a1', fontWeight: 600 }}>Current Accuracy</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0369a1' }}>{prediction.current_accuracy}%</div>
                  </div>
                  <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 12 }}>
                    <div style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Trend</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#059669', textTransform: 'capitalize' }}>
                      {prediction.trend === 'improving' ? '📈 Improving' : prediction.trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                    </div>
                  </div>
                  <div style={{ padding: 16, background: '#f5f3ff', borderRadius: 12 }}>
                    <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>To reach 80%</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed' }}>
                      {prediction.sessions_to_80 > 0 ? `${prediction.sessions_to_80} sessions` : '—'}
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={predictionChart}>
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

            {/* ===== GAME BREAKDOWN ===== */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="dash-progress-card">
                <h2 className="dash-section-title" style={{ marginBottom: 16 }}>🎮 Game Performance</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ padding: 16, background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderRadius: 12 }}>
                    <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>🎧 Similar Words</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed' }}>{wordGameAcc}%</div>
                    <div style={{ fontSize: 11, color: '#5a6b8c' }}>{wordGameHistory.length} sessions</div>
                  </div>
                  <div style={{ padding: 16, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: 12 }}>
                    <div style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>🧠 Sequence</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>{seqGameAcc}%</div>
                    <div style={{ fontSize: 11, color: '#5a6b8c' }}>{seqGameHistory.length} sessions</div>
                  </div>
                </div>
                <div style={{ marginTop: 16, position: 'relative', height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={gamePie} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={65} startAngle={90} endAngle={-270} stroke="none">
                        {gamePie.map((g, i) => <Cell key={i} fill={g.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#102a56' }}>{overall}%</div>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="dash-progress-card">
                <h2 className="dash-section-title" style={{ marginBottom: 16 }}>Difficulty Breakdown</h2>
                {diffPie.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={diffPie} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={60} startAngle={90} endAngle={-270} paddingAngle={3} stroke="none">
                          {diffPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                      {diffPie.map((d, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 5, background: d.color, display: 'inline-block' }} />
                            {d.name}
                          </span>
                          <span style={{ fontWeight: 700, color: '#102a56' }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <p style={{ fontSize: 13, color: '#8a9ab5', textAlign: 'center', padding: 40 }}>No data yet.</p>}
              </motion.div>
            </div>

            {/* ===== WEAK AREAS ===== */}
            {weak.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="dash-weak-card" style={{ marginBottom: 24 }}>
                <h2 className="dash-section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Target size={20} color="#ef4444" /> Areas Needing Practice (Weaknesses)
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {weak.slice(0, 6).map((w, i) => {
                    const acc = w.accuracy;
                    const fill = acc < 50 ? '#ef4444' : acc < 70 ? '#f59e0b' : '#10b981';
                    return (
                      <div key={i} style={{ padding: 16, background: '#fef2f2', borderRadius: 10, borderLeft: `4px solid ${fill}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#102a56' }}>{w.sound_contrast}</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: fill }}>{acc}%</span>
                        </div>
                        <div style={{ height: 6, background: 'white', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${acc}%`, background: fill, borderRadius: 3 }} />
                        </div>
                        <div style={{ fontSize: 11, color: '#5a6b8c', marginTop: 6 }}>
                          {w.attempts} attempts · avg {Math.round((w.avg_response_time || 0) / 100) / 10}s
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ===== FULL SESSION LOG ===== */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="dash-progress-card">
              <h2 className="dash-section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={20} color="#10b981" /> Full Session History
              </h2>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e8f0fe', position: 'sticky', top: 0, background: 'white' }}>
                      <th style={{ padding: 10, textAlign: 'left', color: '#5a6b8c', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: 10, textAlign: 'left', color: '#5a6b8c', fontWeight: 600 }}>Game</th>
                      <th style={{ padding: 10, textAlign: 'left', color: '#5a6b8c', fontWeight: 600 }}>Difficulty</th>
                      <th style={{ padding: 10, textAlign: 'right', color: '#5a6b8c', fontWeight: 600 }}>Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...history].reverse().map((h, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: 10, color: '#102a56' }}>{h.date}</td>
                        <td style={{ padding: 10, color: '#5a6b8c' }}>
                          {h.game_type === 'word_discrimination' ? '🎧 Similar' : '🧠 Sequence'}
                        </td>
                        <td style={{ padding: 10, color: '#5a6b8c', textTransform: 'capitalize' }}>{h.difficulty || '—'}</td>
                        <td style={{ padding: 10, textAlign: 'right', fontWeight: 700, color: h.accuracy >= 70 ? '#10b981' : h.accuracy >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {h.accuracy}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {history.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#8a9ab5', padding: 40 }}>No sessions yet.</p>
                )}
              </div>
            </motion.div>
          </>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    </div>
  );
}