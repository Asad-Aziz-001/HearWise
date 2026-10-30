import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Search, Download, Eye, RefreshCw, X,
  User, Target, TrendingUp, Clock, AlertTriangle,
  ChevronRight, FileText, Calendar
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';
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

export default function AdminReports() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userReport, setUserReport] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (spin = false) => {
    if (spin) setRefreshing(true);
    try {
      const { data } = await api.get('/report/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      toast.error('Could not load user reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openUserReport = async (userId) => {
    setSelectedUser(userId);
    setUserReport(null);
    try {
      const { data } = await api.get(`/admin/users/${userId}/detail`);
      setUserReport(data);
    } catch (err) {
      toast.error('Could not load report');
    }
  };

  const closeReport = () => {
    setSelectedUser(null);
    setUserReport(null);
  };

  const downloadPdf = async (userId, username) => {
    setDownloading(true);
    try {
      const response = await api.get(`/report/admin/user/${userId}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hearwise_report_${username}_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('📄 PDF downloaded');
    } catch (err) {
      toast.error('Could not download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      u =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

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

  return (
    <AdminLayout>
      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'Manrope', fontSize: '1.75rem', fontWeight: 800, color: '#102a56', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={32} color="#1e6ef5" /> User Reports
          </h1>
          <p style={{ fontSize: 14, color: '#5a6b8c', margin: '4px 0 0' }}>
            View and download detailed performance reports for every user
          </p>
        </div>
        <button onClick={() => loadUsers(true)} disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, background: 'white', border: '1px solid #e8f0fe', color: '#5a6b8c', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e8f0fe', borderLeft: '4px solid #1e6ef5' }}>
          <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 4 }}>Total Users</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1e6ef5' }}>{users.length}</div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e8f0fe', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 4 }}>Active Players</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>
            {users.filter(u => u.total_sessions > 0).length}
          </div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e8f0fe', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 4 }}>Avg Accuracy</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>
            {users.length > 0
              ? Math.round(users.reduce((s, u) => s + u.accuracy, 0) / users.length)
              : 0}%
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ background: 'white', padding: 16, borderRadius: 16, border: '1px solid #e8f0fe', marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8a9ab5' }} />
          <input type="text" placeholder="Search users by username or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: 10, border: '1px solid #e8f0fe', fontSize: 14, outline: 'none' }} />
        </div>
      </div>

      {/* Users Table */}
      <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe' }}>
        <div style={{ marginBottom: 12, fontSize: 13, color: '#5a6b8c' }}>
          Showing <strong style={{ color: '#102a56' }}>{filteredUsers.length}</strong> of <strong style={{ color: '#102a56' }}>{users.length}</strong> users
        </div>

        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>📊</div>
            <p style={{ color: '#8a9ab5', fontSize: 15 }}>No users found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e8f0fe' }}>
                  <th style={{ padding: 12, textAlign: 'left', color: '#5a6b8c', fontWeight: 600 }}>User</th>
                  <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Sessions</th>
                  <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Accuracy</th>
                  <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Questions</th>
                  <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Weak Areas</th>
                  <th style={{ padding: 12, textAlign: 'left', color: '#5a6b8c', fontWeight: 600 }}>Last Active</th>
                  <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const accColor = u.accuracy >= 70 ? '#10b981' : u.accuracy >= 50 ? '#f59e0b' : '#ef4444';
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1e6ef5, #a855f7)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>
                            {u.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#102a56' }}>{u.username}</div>
                            <div style={{ fontSize: 11, color: '#8a9ab5' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: 12, textAlign: 'center', fontWeight: 700, color: '#102a56' }}>{u.total_sessions}</td>
                      <td style={{ padding: 12, textAlign: 'center', fontWeight: 800, color: accColor }}>{u.accuracy}%</td>
                      <td style={{ padding: 12, textAlign: 'center', color: '#5a6b8c' }}>{u.total_questions}</td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        {u.weak_areas > 0 ? (
                          <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#dc2626' }}>
                            {u.weak_areas}
                          </span>
                        ) : (
                          <span style={{ color: '#10b981', fontSize: 11, fontWeight: 700 }}>✓</span>
                        )}
                      </td>
                      <td style={{ padding: 12, color: '#8a9ab5', fontSize: 11 }}>{u.last_active}</td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button onClick={() => openUserReport(u.id)} title="View report"
                            style={{ padding: 6, background: '#e8f0fe', color: '#1e6ef5', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                            <Eye size={14} />
                          </button>
                          <button onClick={() => downloadPdf(u.id, u.username)} disabled={downloading} title="Download PDF"
                            style={{ padding: 6, background: '#d1fae5', color: '#059669', border: 'none', borderRadius: 6, cursor: downloading ? 'wait' : 'pointer' }}>
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============ REPORT MODAL ============ */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeReport}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 900, width: '100%', maxHeight: '92vh', overflow: 'auto' }}>
              
              {!userReport ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ width: 40, height: 40, border: '4px solid #e8f0fe', borderTopColor: '#1e6ef5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                  <p style={{ color: '#5a6b8c' }}>Loading report...</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #1e6ef5, #a855f7)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800 }}>
                        {userReport.user.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ fontFamily: 'Manrope', fontSize: '1.5rem', fontWeight: 800, color: '#102a56', margin: 0 }}>
                          {userReport.user.username}
                        </h2>
                        <p style={{ fontSize: 13, color: '#5a6b8c', margin: '4px 0 0' }}>{userReport.user.email}</p>
                        <p style={{ fontSize: 11, color: '#8a9ab5', margin: '4px 0 0' }}>
                          Joined: {userReport.user.created_at} · Status: {userReport.user.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => downloadPdf(userReport.user.id, userReport.user.username)}
                        disabled={downloading}
                        style={{ padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: downloading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Download size={14} /> Download PDF
                      </button>
                      <button onClick={closeReport}
                        style={{ padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                    <div style={{ padding: 16, background: '#eff6ff', borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: '#1e6ef5' }}>{userReport.stats.total_sessions}</div>
                      <div style={{ fontSize: 11, color: '#5a6b8c', marginTop: 2 }}>Sessions</div>
                    </div>
                    <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: '#10b981' }}>{userReport.stats.avg_accuracy}%</div>
                      <div style={{ fontSize: 11, color: '#5a6b8c', marginTop: 2 }}>Accuracy</div>
                    </div>
                    <div style={{ padding: 16, background: '#f5f3ff', borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: '#a855f7' }}>{userReport.stats.total_questions}</div>
                      <div style={{ fontSize: 11, color: '#5a6b8c', marginTop: 2 }}>Questions</div>
                    </div>
                    <div style={{ padding: 16, background: '#fef3c7', borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: '#f59e0b' }}>{userReport.stats.correct_answers}</div>
                      <div style={{ fontSize: 11, color: '#5a6b8c', marginTop: 2 }}>Correct</div>
                    </div>
                  </div>

                  {/* Games Played */}
                  {userReport.game_stats?.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#102a56', marginBottom: 12 }}>Games Played</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                        {userReport.game_stats.map((g, i) => {
                          const info = GAME_INFO[g.game_type] || { name: g.game_type, color: '#5a6b8c' };
                          const accColor = g.accuracy >= 70 ? '#10b981' : g.accuracy >= 50 ? '#f59e0b' : '#ef4444';
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f8faff', borderRadius: 10, border: '1px solid #e8f0fe' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#102a56' }}>{info.name}</div>
                                <div style={{ fontSize: 11, color: '#5a6b8c' }}>{g.sessions} sessions</div>
                              </div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: accColor }}>{g.accuracy}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Weak Areas */}
                  {userReport.weak_areas?.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#102a56', marginBottom: 12 }}>Weak Areas</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {userReport.weak_areas.map((w, i) => (
                          <div key={i} style={{ padding: 12, background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                              <span style={{ fontWeight: 600, color: '#102a56' }}>{w.contrast}</span>
                              <span style={{ fontWeight: 800, color: '#ef4444' }}>{w.accuracy}%</span>
                            </div>
                            <div style={{ height: 6, background: 'white', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${w.accuracy}%`, background: '#ef4444', borderRadius: 3 }} />
                            </div>
                            <div style={{ fontSize: 11, color: '#5a6b8c', marginTop: 4 }}>{w.attempts} attempts</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Sessions */}
                  {userReport.recent_sessions?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#102a56', marginBottom: 12 }}>Recent Sessions</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                        {userReport.recent_sessions.slice(0, 10).map((s, i) => {
                          const info = GAME_INFO[s.game_type] || { name: s.game_type };
                          const accColor = s.accuracy >= 70 ? '#10b981' : s.accuracy >= 50 ? '#f59e0b' : '#ef4444';
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#f8faff', borderRadius: 8, border: '1px solid #e8f0fe', fontSize: 12 }}>
                              <span style={{ flex: 1, color: '#102a56', fontWeight: 600 }}>{info.name}</span>
                              <span style={{ fontSize: 11, color: '#8a9ab5' }}>{s.date}</span>
                              <span style={{ fontWeight: 800, color: accColor, minWidth: 40, textAlign: 'right' }}>{s.accuracy}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* No data */}
                  {userReport.stats.total_sessions === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, background: '#f8faff', borderRadius: 12 }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                      <p style={{ color: '#8a9ab5', fontSize: 14 }}>This user hasn't played any games yet</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}