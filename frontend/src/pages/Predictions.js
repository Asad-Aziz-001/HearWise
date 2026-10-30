import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

export default function Predictions() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/ai-prediction')
      .then(r => {
        setPrediction(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dash-layout">
        <Sidebar />
        <main className="dash-main"><p>Loading predictions...</p></main>
      </div>
    );
  }

  if (!prediction || !prediction.prediction_available) {
    return (
      <div className="dash-layout">
        <Sidebar />
        <main className="dash-main">
          <div className="dash-topbar">
            <div>
              <h1 className="dash-greeting" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={28} color="#10b981" /> AI Predictions
              </h1>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 20, padding: 40, textAlign: 'center', border: '1px solid #e8f0fe' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>📊</div>
            <h2 style={{ fontFamily: 'Manrope', fontSize: '1.3rem', color: '#102a56', marginBottom: 8 }}>
              Need More Data
            </h2>
            <p style={{ fontSize: 15, color: '#5a6b8c' }}>
              {prediction?.message || 'Play at least 3 games to unlock AI predictions.'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const { current_accuracy, sessions_played, trend, sessions_to_80, projected, history } = prediction;

  // Combine history + projected for chart
  const chartData = [
    ...history.map(h => ({ session: h.session, actual: h.accuracy, projected: null })),
    ...projected.map(p => ({ session: p.session, actual: null, projected: p.accuracy })),
  ];

  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-main">
        <div className="dash-topbar">
          <div>
            <h1 className="dash-greeting" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TrendingUp size={28} color="#10b981" /> AI Predictions
            </h1>
            <p className="dash-subtext">AI forecasts your learning trajectory</p>
          </div>
        </div>

        {/* Top stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e8f0fe' }}>
            <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 8 }}>Current Accuracy</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#102a56' }}>{current_accuracy}%</div>
            <div style={{ fontSize: 12, color: '#5a6b8c', marginTop: 8 }}>
              After {sessions_played} sessions
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e8f0fe' }}>
            <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 8 }}>Trend</div>
            <div style={{
              fontSize: 28, fontWeight: 800,
              color: trend === 'improving' ? '#10b981' : trend === 'declining' ? '#ef4444' : '#5a6b8c',
              textTransform: 'capitalize',
            }}>
              {trend === 'improving' ? '📈 Improving'
               : trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
            </div>
            <div style={{ fontSize: 12, color: '#5a6b8c', marginTop: 8 }}>
              Slope: {prediction.slope}/session
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e8f0fe' }}>
            <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 8 }}>To Reach 80%</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#a855f7' }}>
              {sessions_to_80 > 0 ? sessions_to_80 : '—'}
            </div>
            <div style={{ fontSize: 12, color: '#5a6b8c', marginTop: 8 }}>
              {sessions_to_80 > 0 ? `more session${sessions_to_80 > 1 ? 's' : ''}` : 'Focus on accuracy'}
            </div>
          </motion.div>
        </div>

        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e8f0fe' }}>
          <h3 style={{ fontFamily: 'Manrope', fontSize: '1.1rem', color: '#102a56', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={20} color="#1e6ef5" /> Learning Curve & Prediction
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="session" tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }} />
              <Line type="monotone" dataKey="actual" stroke="#1e6ef5" strokeWidth={3} dot={{ r: 4 }} connectNulls />
              <Line type="monotone" dataKey="projected" stroke="#a855f7" strokeWidth={3} strokeDasharray="6 4" dot={{ r: 4 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 16, fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 3, background: '#1e6ef5', borderRadius: 2 }} />
              <span style={{ color: '#5a6b8c' }}>Actual</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 3, background: '#a855f7', borderRadius: 2, borderStyle: 'dashed' }} />
              <span style={{ color: '#5a6b8c' }}>AI Projected</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}