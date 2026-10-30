import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Gamepad2, Target, TrendingUp, RefreshCw, Crown,
  Activity, Clock, Award, AlertTriangle, BarChart3, PieChart as PieIcon,
  LineChart as LineIcon, Zap, UserCheck
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import api from '../../utils/api';
import AdminLayout from './AdminLayout';

const GAME_INFO = {
  similar: { name: 'Similar Sounds', color: '#1e6ef5' },
  sequence: { name: 'Sequence Memory', color: '#10b981' },
  tone_discrimination: { name: 'Tone', color: '#a855f7' },
  rhyme_match: { name: 'Rhyme', color: '#f59e0b' },
  word_position: { name: 'Word Position', color: '#0ea5e9' },
  word_chain_memory: { name: 'Chain', color: '#8b5cf6' },
  phoneme_replacement: { name: 'Phoneme', color: '#ec4899' },
  audio_story: { name: 'Story', color: '#14b8a6' },
  pronunciation: { name: 'Pronunciation', color: '#f97316' },
  emotion_detection: { name: 'Emotion', color: '#eab308' },
  word_in_noise: { name: 'Noise', color: '#6366f1' },
};

const CHART_COLORS = ['#1e6ef5', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#eab308'];

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [usersData, setUsersData] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Auto-refresh every 30 seconds
  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setRefreshing(true);
    try {
      const [d, du, dt] = await Promise.all([
        api.get('/admin/dashboard').then(r => r.data).catch(() => null),
        api.get('/admin/dashboard-users').then(r => r.data).catch(() => null),
        api.get('/admin/dashboard-timeline').then(r => r.data).catch(() => null),
      ]);
      setData(d);
      setUsersData(du?.users || []);
      setTimeline(dt?.timeline || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #e8f0fe', borderTopColor: '#1e6ef5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </AdminLayout>
    );
  }

  // Prepare chart data
  const gameBreakdownData = data?.game_breakdown?.map(g => ({
    name: GAME_INFO[g.game_type]?.name || g.game_type,
    value: g.sessions,
    color: GAME_INFO[g.game_type]?.color || '#5a6b8c',
  })) || [];

  // Top 10 users by accuracy (with minimum 3 sessions)
  const topUsersChart = usersData
    .filter(u => u.sessions >= 3)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 10)
    .map(u => ({
      name: u.username.length > 8 ? u.username.substring(0, 8) + '...' : u.username,
      fullName: u.username,
      accuracy: u.accuracy,
      sessions: u.sessions,
    }));

  // Top 10 users by sessions
  const mostActiveUsersChart = usersData
    .slice(0, 10)
    .map(u => ({
      name: u.username.length > 8 ? u.username.substring(0, 8) + '...' : u.username,
      fullName: u.username,
      sessions: u.sessions,
      questions: u.total_questions,
    }));

  // Radar for game diversity
  const radarData = usersData
    .filter(u => u.sessions >= 5)
    .slice(0, 5)
    .map(u => {
      const gameTypes = {};
      return {
        user: u.username.substring(0, 8),
        sessions: u.sessions,
        accuracy: u.accuracy,
        questions: Math.min(u.total_questions, 200),
      };
    });

  // Sessions + accuracy timeline
  const timelineData = timeline.map(t => ({
    date: t.date.slice(5),  // MM-DD
    sessions: t.sessions,
    accuracy: t.accuracy,
    activeUsers: t.active_users,
  }));

  return (
    <AdminLayout>
      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{
            fontFamily: 'Manrope',
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#102a56',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <Crown size={32} color="#f59e0b" /> Admin Dashboard
          </h1>
          <p style={{ fontSize: 14, color: '#5a6b8c', margin: '4px 0 0' }}>
            System overview and user analytics · Last updated {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            borderRadius: 10,
            background: 'white',
            border: '1px solid #e8f0fe',
            color: '#5a6b8c',
            fontSize: 13,
            fontWeight: 600,
            cursor: refreshing ? 'wait' : 'pointer',
          }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        <StatCard
          icon={Users}
          label="Total Users"
          value={data?.users?.total || 0}
          subtitle={`${data?.users?.active || 0} active`}
          color="#1e6ef5"
          bg="#e8f0fe"
          delay={0}
        />
        <StatCard
          icon={Gamepad2}
          label="Total Sessions"
          value={data?.sessions?.total || 0}
          subtitle={`${data?.sessions?.recent_7d || 0} this week`}
          color="#10b981"
          bg="#d1fae5"
          delay={0.05}
        />
        <StatCard
          icon={Target}
          label="Total Attempts"
          value={data?.attempts?.total || 0}
          subtitle={`${data?.attempts?.correct || 0} correct`}
          color="#a855f7"
          bg="#ede9fe"
          delay={0.1}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Accuracy"
          value={`${data?.attempts?.accuracy || 0}%`}
          subtitle="All users"
          color="#f59e0b"
          bg="#fef3c7"
          delay={0.15}
        />
      </div>

      {/* Row 1: Line Chart — Timeline */}
      <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <LineIcon size={20} color="#1e6ef5" />
          <h3 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, color: '#102a56', margin: 0 }}>
            Activity Timeline (Last 30 Days)
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timelineData} margin={{ top: 10, right: 30, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="sessionsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1e6ef5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1e6ef5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={{ background: 'white', padding: 12, borderRadius: 8, border: '1px solid #e8f0fe', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#102a56', marginBottom: 6 }}>{label}</div>
                    {payload.map((p, i) => (
                      <div key={i} style={{ fontSize: 11, color: p.color, marginBottom: 2 }}>
                        {p.name}: <strong>{p.value}</strong>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <Area type="monotone" dataKey="sessions" stroke="#1e6ef5" fill="url(#sessionsGrad)" strokeWidth={2.5} name="Sessions" />
            <Area type="monotone" dataKey="accuracy" stroke="#10b981" fill="url(#accuracyGrad)" strokeWidth={2.5} name="Accuracy %" />
            <Line type="monotone" dataKey="activeUsers" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} name="Active Users" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Row 2: Bar Chart (Top Users) + Pie Chart (Games) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Top Users Bar Chart */}
        <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <BarChart3 size={20} color="#10b981" />
            <h3 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, color: '#102a56', margin: 0 }}>
              Top Users by Accuracy
            </h3>
          </div>
          {topUsersChart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#8a9ab5', fontSize: 13 }}>
              No users with 3+ sessions yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topUsersChart} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={70} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }}
                  formatter={(value) => [`${value}%`, 'Accuracy']}
                  labelFormatter={(label) => {
                    const user = topUsersChart.find(u => u.name === label);
                    return user ? user.fullName : label;
                  }}
                />
                <Bar dataKey="accuracy" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Games Pie Chart */}
        <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <PieIcon size={20} color="#a855f7" />
            <h3 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, color: '#102a56', margin: 0 }}>
              Game Distribution
            </h3>
          </div>
          {gameBreakdownData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#8a9ab5', fontSize: 13 }}>
              No sessions yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gameBreakdownData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  stroke="none"
                  label={(entry) => `${entry.name} (${entry.value})`}
                  labelLine={{ stroke: '#8a9ab5' }}
                >
                  {gameBreakdownData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3: Sessions Bar Chart + Active Users */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Sessions by Game */}
        <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <BarChart3 size={20} color="#f59e0b" />
            <h3 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, color: '#102a56', margin: 0 }}>
              Sessions by Game Type
            </h3>
          </div>
          {data?.game_breakdown?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#8a9ab5', fontSize: 13 }}>No sessions yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data?.game_breakdown?.sort((a, b) => b.sessions - a.sessions).map(g => ({
                  name: GAME_INFO[g.game_type]?.name || g.game_type,
                  sessions: g.sessions,
                  color: GAME_INFO[g.game_type]?.color || '#5a6b8c',
                }))}
                layout="vertical"
                margin={{ top: 5, right: 30, bottom: 5, left: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#102a56' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }} />
                <Bar dataKey="sessions" radius={[0, 6, 6, 0]}>
                  {data?.game_breakdown?.map((entry, i) => (
                    <Cell key={i} fill={GAME_INFO[entry.game_type]?.color || '#5a6b8c'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Most Active Users */}
        <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Users size={20} color="#0ea5e9" />
            <h3 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, color: '#102a56', margin: 0 }}>
              Most Active Users
            </h3>
          </div>
          {mostActiveUsersChart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#8a9ab5', fontSize: 13 }}>No active users</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mostActiveUsersChart.map((u, i) => {
                const maxSessions = mostActiveUsersChart[0].sessions;
                const pct = (u.sessions / maxSessions) * 100;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: '#102a56', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#e8f0fe', color: '#1e6ef5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
                          {i + 1}
                        </span>
                        {u.fullName}
                      </span>
                      <span style={{ fontWeight: 700, color: '#0ea5e9' }}>
                        {u.sessions} sessions
                      </span>
                    </div>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #0ea5e9, #0284c7)', borderRadius: 4, transition: 'width 0.6s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: All Users Table */}
      <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} color="#1e6ef5" />
            <h3 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, color: '#102a56', margin: 0 }}>
              All Users Performance
            </h3>
          </div>
          <span style={{ fontSize: 12, color: '#8a9ab5' }}>
            {usersData.length} users total
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e8f0fe' }}>
                <th style={{ padding: 12, textAlign: 'left', color: '#5a6b8c', fontWeight: 600 }}>#</th>
                <th style={{ padding: 12, textAlign: 'left', color: '#5a6b8c', fontWeight: 600 }}>User</th>
                <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Status</th>
                <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Sessions</th>
                <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Accuracy</th>
                <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Questions</th>
                <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Time (min)</th>
                <th style={{ padding: 12, textAlign: 'left', color: '#5a6b8c', fontWeight: 600 }}>Favorite Game</th>
                <th style={{ padding: 12, textAlign: 'left', color: '#5a6b8c', fontWeight: 600 }}>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {usersData.map((u, i) => {
                const accColor = u.accuracy >= 70 ? '#10b981' : u.accuracy >= 50 ? '#f59e0b' : '#ef4444';
                const favGame = GAME_INFO[u.favorite_game];
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 12, color: '#8a9ab5', fontWeight: 700 }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #1e6ef5, #a855f7)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                          {u.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#102a56' }}>{u.username}</div>
                          <div style={{ fontSize: 11, color: '#8a9ab5' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                        background: u.is_active ? '#d1fae5' : '#fee2e2',
                        color: u.is_active ? '#059669' : '#dc2626' }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: 'center', fontWeight: 700, color: '#102a56' }}>
                      {u.sessions}
                    </td>
                    <td style={{ padding: 12, textAlign: 'center', fontWeight: 800, color: accColor }}>
                      {u.accuracy}%
                    </td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#5a6b8c' }}>
                      {u.total_questions}
                    </td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#5a6b8c' }}>
                      {u.total_time_min}
                    </td>
                    <td style={{ padding: 12, color: '#5a6b8c', fontSize: 12 }}>
                      {favGame ? favGame.name : '—'}
                    </td>
                    <td style={{ padding: 12, color: '#8a9ab5', fontSize: 11 }}>
                      {u.last_active}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}

// ============================================================
// STAT CARD COMPONENT
// ============================================================
function StatCard({ icon: Icon, label, value, subtitle, color, bg, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        background: 'white',
        padding: 24,
        borderRadius: 16,
        border: '1px solid #e8f0fe',
        boxShadow: '0 4px 20px rgba(16, 42, 86, 0.06)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: '#5a6b8c', fontWeight: 600 }}>{label}</span>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: bg,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={16} />
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#102a56', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 6 }}>
        {subtitle}
      </div>
    </motion.div>
  );
}