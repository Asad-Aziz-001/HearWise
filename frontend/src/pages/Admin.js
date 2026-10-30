import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Gamepad2, Target, TrendingUp, BarChart3, Activity,
  UserCheck, UserX, Trash2, Crown, RefreshCw, FileText, ArrowLeft,
  X, Calendar, Award, Clock, Zap, Flame
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../utils/api';
import AdminSidebar from '../components/AdminSidebar';

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

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [usersActivity, setUsersActivity] = useState([]);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async (spin = false) => {
    if (spin) setRefreshing(true);
    try {
      const [d, u, a, ua, da] = await Promise.all([
        api.get('/admin/dashboard').then(r => r.data).catch(() => null),
        api.get('/admin/users').then(r => r.data).catch(() => null),
        api.get('/admin/activity').then(r => r.data).catch(() => null),
        api.get('/admin/users-activity').then(r => r.data).catch(() => null),
        api.get('/admin/daily-activity').then(r => r.data).catch(() => null),
      ]);
      setData(d);
      setUsers(u?.users || []);
      setActivity(a?.activity || []);
      setUsersActivity(ua?.users || []);
      setDailyActivity(da?.days || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openUserDetail = async (userId) => {
    setSelectedUser(userId);
    setUserDetail(null);
    try {
      const { data } = await api.get(`/admin/users/${userId}/detail`);
      setUserDetail(data);
    } catch (err) {
      toast.error('Could not load user detail');
    }
  };

  const closeUserDetail = () => {
    setSelectedUser(null);
    setUserDetail(null);
  };

  const toggleUserActive = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}`, { is_active: !currentStatus });
      toast.success('User updated');
      loadAll();
    } catch (err) {
      toast.error('Could not update user');
    }
  };

  const deleteUser = async (userId, username) => {
    if (!window.confirm(`Delete "${username}"? All data will be lost.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete user');
    }
  };

  const getHeatColor = (count) => {
    if (count === 0) return '#ebedf0';
    if (count === 1) return '#c6e48b';
    if (count === 2) return '#7bc96f';
    if (count === 3) return '#239a3b';
    if (count <= 5) return '#196127';
    return '#0e4429';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <AdminSidebar />
        <main style={{ flex: 1, marginLeft: 260, padding: '32px 40px', background: '#f5f8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, border: '4px solid #e8f0fe', borderTopColor: '#1e6ef5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#5a6b8c' }}>Loading admin panel...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </main>
      </div>
    );
  }

  const topPerformers = [...usersActivity].filter(u => u.sessions > 0).sort((a, b) => b.accuracy - a.accuracy).slice(0, 5);
  const strugglingUsers = [...usersActivity].filter(u => u.sessions > 0 && u.accuracy < 50).slice(0, 5);

  // Prepare pie chart data
  const pieData = data?.game_breakdown?.map(g => {
    const info = GAME_INFO[g.game_type] || { name: g.game_type, color: '#5a6b8c' };
    return { name: info.name, value: g.sessions, color: info.color };
  }) || [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f8ff' }}>
      <AdminSidebar />
      <main style={{ flex: 1, marginLeft: 260, padding: '32px 40px', minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#102a56', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Crown size={32} color="#f59e0b" /> Admin Dashboard
            </h1>
            <p style={{ fontSize: 14, color: '#5a6b8c', margin: '4px 0 0' }}>
              Complete system overview & user activity
            </p>
          </div>
          <button
            onClick={() => loadAll(true)}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, background: 'white', border: '1px solid #e8f0fe', color: '#5a6b8c', fontSize: 13, fontWeight: 600, cursor: refreshing ? 'wait' : 'pointer' }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #e8f0fe', paddingBottom: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'All Users', icon: Users },
            { id: 'activity', label: 'Live Activity', icon: Activity },
            { id: 'content', label: 'Content', icon: FileText },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: tab === t.id ? '#1e6ef5' : 'white', color: tab === t.id ? 'white' : '#5a6b8c', border: tab === t.id ? 'none' : '1px solid #e8f0fe', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* ============ OVERVIEW TAB ============ */}
        {tab === 'overview' && data && (
          <>
            {/* 4 Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe', boxShadow: '0 4px 20px rgba(16, 42, 86, 0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#5a6b8c', fontWeight: 600 }}>Total Users</span>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e8f0fe', color: '#1e6ef5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={16} />
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#102a56' }}>{data.users.total}</div>
                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 4 }}>
                  +{data.users.recent_7d} this week
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe', boxShadow: '0 4px 20px rgba(16, 42, 86, 0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#5a6b8c', fontWeight: 600 }}>Total Sessions</span>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#d1fae5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Gamepad2 size={16} />
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#102a56' }}>{data.sessions.total}</div>
                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 4 }}>
                  +{data.sessions.recent_7d} this week
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe', boxShadow: '0 4px 20px rgba(16, 42, 86, 0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#5a6b8c', fontWeight: 600 }}>Total Attempts</span>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ede9fe', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Target size={16} />
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#102a56' }}>{data.attempts.total}</div>
                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 4 }}>
                  {data.attempts.correct} correct
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe', boxShadow: '0 4px 20px rgba(16, 42, 86, 0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#5a6b8c', fontWeight: 600 }}>Global Accuracy</span>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={16} />
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#102a56' }}>{data.attempts.accuracy}%</div>
                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 4 }}>
                  All users avg
                </div>
              </motion.div>
            </div>

            {/* Row 2: Activity Heatmap + Game Pie */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
              {/* Heatmap */}
              <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe' }}>
                <h3 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, color: '#102a56', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Flame size={20} color="#f59e0b" /> Daily Activity (Last 30 Days)
                </h3>
                <div style={{ display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 8 }}>
                  {dailyActivity.map((d, i) => (
                    <div key={i} style={{ textAlign: 'center', minWidth: 20 }}>
                      <div
                        title={`${d.date}: ${d.sessions} sessions`}
                        style={{
                          width: 18, height: 18, borderRadius: 3,
                          background: getHeatColor(d.sessions),
                          cursor: 'pointer',
                          marginBottom: 4,
                        }}
                      />
                      {(i % 5 === 0) && (
                        <div style={{ fontSize: 9, color: '#8a9ab5' }}>
                          {d.date.slice(5)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11, color: '#8a9ab5' }}>
                  <span>Less</span>
                  {['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127', '#0e4429'].map((c, i) => (
                    <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
                  ))}
                  <span>More</span>
                </div>
              </div>

              {/* Game Pie */}
              <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe' }}>
                <h3 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, color: '#102a56', marginBottom: 16 }}>
                  Games Distribution
                </h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} stroke="none">
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ fontSize: 13, color: '#8a9ab5', textAlign: 'center', padding: 40 }}>No games yet</p>
                )}
              </div>
            </div>

            {/* Row 3: Top Performers + Struggling */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {/* Top Performers */}
              <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe' }}>
                <h3 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, color: '#102a56', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={20} color="#f59e0b" /> Top Performers 🏆
                </h3>
                {topPerformers.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#8a9ab5', textAlign: 'center', padding: 20 }}>No active users yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {topPerformers.map((u, i) => (
                      <div key={u.id} onClick={() => openUserDetail(u.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: '#f8faff', borderRadius: 10, cursor: 'pointer', border: '1px solid #e8f0fe' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: ['#fbbf24', '#94a3b8', '#f97316', '#60a5fa', '#a78bfa'][i], color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#102a56' }}>{u.username}</div>
                          <div style={{ fontSize: 11, color: '#5a6b8c' }}>{u.sessions} sessions · {u.total_questions} Qs</div>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>{u.accuracy}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Struggling Users */}
              <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe' }}>
                <h3 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, color: '#102a56', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Target size={20} color="#ef4444" /> Needs Attention ⚠️
                </h3>
                {strugglingUsers.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#8a9ab5', textAlign: 'center', padding: 20 }}>All users doing well! 🎉</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {strugglingUsers.map((u) => (
                      <div key={u.id} onClick={() => openUserDetail(u.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: '#fef2f2', borderRadius: 10, cursor: 'pointer', border: '1px solid #fecaca' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                          {u.username?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#102a56' }}>{u.username}</div>
                          <div style={{ fontSize: 11, color: '#5a6b8c' }}>{u.sessions} sessions</div>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#ef4444' }}>{u.accuracy}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 4: Game Sessions Bar Chart */}
            <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe' }}>
              <h3 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, color: '#102a56', marginBottom: 16 }}>
                Sessions by Game Type
              </h3>
              {data.game_breakdown.length === 0 ? (
                <p style={{ fontSize: 13, color: '#8a9ab5', textAlign: 'center', padding: 40 }}>No sessions yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(200, data.game_breakdown.length * 40)}>
                  <BarChart
                    data={data.game_breakdown.sort((a, b) => b.sessions - a.sessions).map(g => ({
                      game: `${GAME_INFO[g.game_type]?.emoji || '🎮'} ${GAME_INFO[g.game_type]?.name || g.game_type}`,
                      sessions: g.sessions,
                      color: GAME_INFO[g.game_type]?.color || '#5a6b8c',
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 20, bottom: 5, left: 140 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#8a9ab5' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="game" type="category" tick={{ fontSize: 12, fill: '#102a56' }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }} />
                    <Bar dataKey="sessions" radius={[0, 6, 6, 0]}>
                      {data.game_breakdown.map((entry, i) => (
                        <Cell key={i} fill={GAME_INFO[entry.game_type]?.color || '#5a6b8c'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}

        {/* ============ ALL USERS TAB — Detailed Activity ============ */}
        {tab === 'users' && (
          <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, color: '#102a56', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={20} /> User Activity ({usersActivity.length})
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e8f0fe' }}>
                    <th style={{ padding: 12, textAlign: 'left', color: '#5a6b8c', fontWeight: 600 }}>User</th>
                    <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Sessions</th>
                    <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Accuracy</th>
                    <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Questions</th>
                    <th style={{ padding: 12, textAlign: 'left', color: '#5a6b8c', fontWeight: 600 }}>Favorite Game</th>
                    <th style={{ padding: 12, textAlign: 'left', color: '#5a6b8c', fontWeight: 600 }}>Last Active</th>
                    <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersActivity.map(u => {
                    const favInfo = u.favorite_game ? GAME_INFO[u.favorite_game] : null;
                    const accColor = u.accuracy >= 70 ? '#10b981' : u.accuracy >= 50 ? '#f59e0b' : '#ef4444';
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: 12 }}>
                          <div style={{ fontWeight: 600, color: '#102a56' }}>{u.username}</div>
                          <div style={{ fontSize: 11, color: '#8a9ab5' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: 12, textAlign: 'center', fontWeight: 700, color: '#102a56' }}>{u.sessions}</td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <span style={{ fontWeight: 800, color: accColor }}>{u.accuracy}%</span>
                        </td>
                        <td style={{ padding: 12, textAlign: 'center', color: '#5a6b8c' }}>{u.total_questions}</td>
                        <td style={{ padding: 12 }}>
                          {favInfo ? (
                            <span style={{ fontSize: 12 }}>{favInfo.emoji} {favInfo.name}</span>
                          ) : (
                            <span style={{ fontSize: 12, color: '#8a9ab5' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: 12, fontSize: 11, color: '#5a6b8c' }}>{u.last_active}</td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button onClick={() => openUserDetail(u.id)} title="View details"
                              style={{ padding: 6, background: '#e8f0fe', color: '#1e6ef5', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                              <Activity size={14} />
                            </button>
                            <button onClick={() => toggleUserActive(u.id, u.is_active)} title={u.is_active ? 'Deactivate' : 'Activate'}
                              style={{ padding: 6, background: u.is_active ? '#fee2e2' : '#d1fae5', color: u.is_active ? '#dc2626' : '#059669', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                              {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                            </button>
                            <button onClick={() => deleteUser(u.id, u.username)} title="Delete"
                              style={{ padding: 6, background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============ LIVE ACTIVITY TAB ============ */}
        {tab === 'activity' && (
          <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe' }}>
            <h3 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, color: '#102a56', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={20} /> Live Activity Feed (Last 20)
            </h3>
            {activity.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#8a9ab5', padding: 40 }}>No activity yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activity.map((a, i) => {
                  const info = GAME_INFO[a.game_type] || { name: a.game_type, emoji: '🎮', color: '#5a6b8c' };
                  const accColor = a.accuracy >= 70 ? '#10b981' : a.accuracy >= 50 ? '#f59e0b' : '#ef4444';
                  return (
                    <motion.div key={a.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: '#f8faff', borderRadius: 12, border: '1px solid #e8f0fe' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${info.color}15`, color: info.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                        {info.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#102a56' }}>{a.user}</div>
                        <div style={{ fontSize: 12, color: '#5a6b8c' }}>{info.name} · {a.difficulty} · {a.date}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: accColor }}>{a.accuracy}%</div>
                        <div style={{ fontSize: 11, color: '#5a6b8c' }}>{a.correct_answers}/{a.total_questions}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============ CONTENT TAB ============ */}
        {tab === 'content' && (
          <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe' }}>
            <h3 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, color: '#102a56', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={20} /> Word Pairs Content
            </h3>
            <p style={{ fontSize: 13, color: '#5a6b8c', padding: 40, textAlign: 'center' }}>
              💡 AI generates content dynamically. No manual word pairs needed.
            </p>
          </div>
        )}
      </main>

      {/* ============ USER DETAIL MODAL ============ */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeUserDetail}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white', borderRadius: 20, padding: 32,
                maxWidth: 700, width: '100%', maxHeight: '90vh', overflow: 'auto',
              }}
            >
              {!userDetail ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ width: 40, height: 40, border: '4px solid #e8f0fe', borderTopColor: '#1e6ef5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                  <p style={{ color: '#5a6b8c' }}>Loading user details...</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        width: 60, height: 60, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1e6ef5, #a855f7)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, fontWeight: 800,
                      }}>
                        {userDetail.user.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ fontFamily: 'Manrope', fontSize: '1.4rem', fontWeight: 800, color: '#102a56', margin: 0 }}>
                          {userDetail.user.username}
                        </h2>
                        <p style={{ fontSize: 13, color: '#5a6b8c', margin: '4px 0 0' }}>
                          {userDetail.user.email}
                        </p>
                        <span style={{
                          display: 'inline-block', padding: '4px 10px', borderRadius: 6,
                          fontSize: 11, fontWeight: 700, marginTop: 6,
                          background: userDetail.user.is_active ? '#d1fae5' : '#fee2e2',
                          color: userDetail.user.is_active ? '#059669' : '#dc2626',
                        }}>
                          {userDetail.user.is_active ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </div>
                    </div>
                    <button onClick={closeUserDetail}
                      style={{ padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                      <X size={18} />
                    </button>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                    <div style={{ padding: 16, background: '#eff6ff', borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#1e6ef5' }}>{userDetail.stats.total_sessions}</div>
                      <div style={{ fontSize: 11, color: '#5a6b8c' }}>Sessions</div>
                    </div>
                    <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{userDetail.stats.avg_accuracy}%</div>
                      <div style={{ fontSize: 11, color: '#5a6b8c' }}>Accuracy</div>
                    </div>
                    <div style={{ padding: 16, background: '#f5f3ff', borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#a855f7' }}>{userDetail.stats.total_questions}</div>
                      <div style={{ fontSize: 11, color: '#5a6b8c' }}>Questions</div>
                    </div>
                    <div style={{ padding: 16, background: '#fef3c7', borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>{userDetail.stats.correct_answers}</div>
                      <div style={{ fontSize: 11, color: '#5a6b8c' }}>Correct</div>
                    </div>
                  </div>

                  {/* Game Breakdown */}
                  {userDetail.game_stats.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#102a56', marginBottom: 12 }}>🎮 Games Played</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {userDetail.game_stats.map((g, i) => {
                          const info = GAME_INFO[g.game_type] || { name: g.game_type, emoji: '🎮', color: '#5a6b8c' };
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: '#f8faff', borderRadius: 8 }}>
                              <span style={{ fontSize: 20 }}>{info.emoji}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#102a56' }}>{info.name}</div>
                                <div style={{ fontSize: 11, color: '#5a6b8c' }}>{g.sessions} sessions</div>
                              </div>
                              <div style={{ fontWeight: 800, color: g.accuracy >= 70 ? '#10b981' : g.accuracy >= 50 ? '#f59e0b' : '#ef4444' }}>
                                {g.accuracy}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recent Sessions */}
                  {userDetail.recent_sessions.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#102a56', marginBottom: 12 }}>📅 Recent Sessions</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 250, overflowY: 'auto' }}>
                        {userDetail.recent_sessions.map((s, i) => {
                          const info = GAME_INFO[s.game_type] || { name: s.game_type, emoji: '🎮' };
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
                              <span>{info.emoji}</span>
                              <span style={{ flex: 1, color: '#102a56', fontWeight: 600 }}>{info.name}</span>
                              <span style={{ color: '#8a9ab5' }}>{s.date}</span>
                              <span style={{ fontWeight: 800, color: s.accuracy >= 70 ? '#10b981' : '#f59e0b' }}>{s.accuracy}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}