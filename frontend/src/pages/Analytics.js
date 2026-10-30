import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Activity, Clock, TrendingUp, Flame, Calendar, Award
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, Cell
} from 'recharts';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Analytics() {
  const [heatmap, setHeatmap] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [focusTime, setFocusTime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/heatmap').then(r => r.data).catch(() => null),
      api.get('/analytics/comparison').then(r => r.data).catch(() => null),
      api.get('/analytics/focus-time').then(r => r.data).catch(() => null),
    ]).then(([h, c, f]) => {
      setHeatmap(h);
      setComparison(c);
      setFocusTime(f);
      setLoading(false);
    });
  }, []);

  const getHeatColor = (count) => {
    if (count === 0) return '#ebedf0';
    if (count === 1) return '#c6e48b';
    if (count === 2) return '#7bc96f';
    if (count === 3) return '#239a3b';
    return '#196127';
  };

  // Group heatmap into weeks
  const heatmapWeeks = [];
  if (heatmap) {
    let week = [];
    heatmap.days.forEach((day, i) => {
      week.push(day);
      if (week.length === 7 || i === heatmap.days.length - 1) {
        heatmapWeeks.push(week);
        week = [];
      }
    });
  }

  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-main">
        <div className="dash-topbar">
          <div>
            <h1 className="dash-greeting" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BarChart3 size={28} color="#1e6ef5" /> Advanced Analytics
            </h1>
            <p className="dash-subtext">Deep dive into your practice patterns</p>
          </div>
        </div>

        {loading ? <p>Loading analytics...</p> : (
          <>
            {/* This week vs last week */}
            {comparison && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e8f0fe' }}>
                  <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 8 }}>This Week Sessions</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#102a56' }}>
                    {comparison.this_week.sessions}
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 600, marginTop: 8,
                    color: comparison.change.sessions >= 0 ? '#10b981' : '#ef4444',
                  }}>
                    {comparison.change.sessions >= 0 ? '↑' : '↓'} {Math.abs(comparison.change.sessions)} vs last week
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e8f0fe' }}>
                  <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 8 }}>This Week Accuracy</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#102a56' }}>
                    {comparison.this_week.accuracy}%
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 600, marginTop: 8,
                    color: comparison.change.accuracy >= 0 ? '#10b981' : '#ef4444',
                  }}>
                    {comparison.change.accuracy >= 0 ? '↑' : '↓'} {Math.abs(comparison.change.accuracy)}% vs last week
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e8f0fe' }}>
                  <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 8 }}>Total Focus Time</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#102a56' }}>
                    {focusTime?.total_minutes || 0}<span style={{ fontSize: 16 }}> min</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8, color: '#5a6b8c' }}>
                    Avg {focusTime?.avg_per_session || 0} min/session
                  </div>
                </motion.div>
              </div>
            )}

            {/* Heatmap */}
            {heatmap && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e8f0fe', marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'Manrope', fontSize: '1.1rem', color: '#102a56', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Flame size={20} color="#f59e0b" /> Activity Heatmap (Last 60 Days)
                </h3>
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
                            title={`${day.date}: ${day.count} session${day.count !== 1 ? 's' : ''}`}
                            style={{
                              width: 14, height: 14,
                              borderRadius: 3,
                              background: getHeatColor(day.count),
                              cursor: 'pointer',
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

            {/* Focus time chart */}
            {focusTime && focusTime.by_day && focusTime.by_day.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e8f0fe' }}>
                <h3 style={{ fontFamily: 'Manrope', fontSize: '1.1rem', color: '#102a56', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={20} color="#a855f7" /> Focus Time (Last 14 Days)
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={focusTime.by_day.map(d => ({ ...d, day: d.date.slice(-5) }))}>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8a9ab5' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#8a9ab5' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}m`} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }} />
                    <Bar dataKey="minutes" fill="#a855f7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}