import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserCheck, UserX, Trash2, X, Activity, RefreshCw,
  Search, Filter, ChevronDown, TrendingUp, TrendingDown,
  Calendar, Target, Award, Zap, ArrowUpDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import AdminLayout from './AdminLayout';

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
};

// Get level badge based on sessions
function getLevelBadge(sessions) {
  if (sessions >= 100) return { label: 'Diamond', color: '#06b6d4', emoji: '💎', bg: '#cffafe' };
  if (sessions >= 50) return { label: 'Platinum', color: '#a855f7', emoji: '🥇', bg: '#f3e8ff' };
  if (sessions >= 25) return { label: 'Gold', color: '#f59e0b', emoji: '🏆', bg: '#fef3c7' };
  if (sessions >= 10) return { label: 'Silver', color: '#64748b', emoji: '🥈', bg: '#f1f5f9' };
  if (sessions >= 3) return { label: 'Bronze', color: '#d97706', emoji: '🥉', bg: '#fef2f2' };
  return { label: 'Newbie', color: '#6b7280', emoji: '🌱', bg: '#f9fafb' };
}

// Get accuracy color
function getAccColor(acc) {
  if (acc >= 70) return '#10b981';
  if (acc >= 50) return '#f59e0b';
  return '#ef4444';
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent | sessions | accuracy | name
  const [filterRole, setFilterRole] = useState('all'); // all | active | inactive
  const [filterLevel, setFilterLevel] = useState('all'); // all | newbie | bronze | silver | gold | platinum | diamond

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (spin = false) => {
    if (spin) setRefreshing(true);
    try {
      const { data } = await api.get('/admin/users-activity');
      setUsers(data.users || []);
    } catch (err) {
      toast.error('Could not load users');
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
      toast.success(!currentStatus ? '✅ User activated' : '⏸️ User deactivated');
      loadUsers();
    } catch (err) {
      toast.error('Could not update user');
    }
  };

  const deleteUser = async (userId, username) => {
    if (!window.confirm(`Delete "${username}"? All their data will be lost.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete user');
    }
  };

  // Filtered + sorted users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        u =>
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    // Filter by role/status
    if (filterRole === 'active') {
      result = result.filter(u => u.is_active);
    } else if (filterRole === 'inactive') {
      result = result.filter(u => !u.is_active);
    }

    // Filter by level
    if (filterLevel !== 'all') {
      result = result.filter(u => {
        const level = getLevelBadge(u.sessions);
        return level.label.toLowerCase() === filterLevel;
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'sessions':
          return b.sessions - a.sessions;
        case 'accuracy':
          return b.accuracy - a.accuracy;
        case 'name':
          return a.username.localeCompare(b.username);
        case 'recent':
        default:
          // Last active (parse dates)
          if (a.last_active === 'Never') return 1;
          if (b.last_active === 'Never') return -1;
          return b.last_active.localeCompare(a.last_active);
      }
    });

    return result;
  }, [users, searchQuery, filterRole, filterLevel, sortBy]);

  // Stats summary
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.is_active).length;
    const withSessions = users.filter(u => u.sessions > 0).length;
    const avgAccuracy =
      withSessions > 0
        ? Math.round(
            users
              .filter(u => u.sessions > 0)
              .reduce((s, u) => s + u.accuracy, 0) / withSessions
          )
        : 0;
    return { total, active, withSessions, avgAccuracy };
  }, [users]);

  return (
    <AdminLayout>
      {/* Topbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16,
      }}>
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
            <Users size={32} color="#1e6ef5" /> All Users
          </h1>
          <p style={{ fontSize: 14, color: '#5a6b8c', margin: '4px 0 0' }}>
            Detailed activity for every user
          </p>
        </div>
        <button
          onClick={() => loadUsers(true)}
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
          <RefreshCw
            size={14}
            style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
          />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 24,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'white',
            padding: 20,
            borderRadius: 16,
            border: '1px solid #e8f0fe',
            borderLeft: '4px solid #1e6ef5',
          }}
        >
          <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 4 }}>Total Users</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1e6ef5' }}>
            {stats.total}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            background: 'white',
            padding: 20,
            borderRadius: 16,
            border: '1px solid #e8f0fe',
            borderLeft: '4px solid #10b981',
          }}
        >
          <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 4 }}>Active</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>
            {stats.active}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'white',
            padding: 20,
            borderRadius: 16,
            border: '1px solid #e8f0fe',
            borderLeft: '4px solid #a855f7',
          }}
        >
          <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 4 }}>Played Games</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#a855f7' }}>
            {stats.withSessions}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            background: 'white',
            padding: 20,
            borderRadius: 16,
            border: '1px solid #e8f0fe',
            borderLeft: '4px solid #f59e0b',
          }}
        >
          <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 4 }}>Avg Accuracy</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>
            {stats.avgAccuracy}%
          </div>
        </motion.div>
      </div>

      {/* Filters Bar */}
      <div style={{
        background: 'white',
        padding: 16,
        borderRadius: 16,
        border: '1px solid #e8f0fe',
        marginBottom: 16,
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8a9ab5',
            }}
          />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 42px',
              borderRadius: 10,
              border: '1px solid #e8f0fe',
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>

        {/* Filter Role */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #e8f0fe',
            fontSize: 13,
            fontWeight: 600,
            color: '#102a56',
            cursor: 'pointer',
            background: 'white',
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        {/* Filter Level */}
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #e8f0fe',
            fontSize: 13,
            fontWeight: 600,
            color: '#102a56',
            cursor: 'pointer',
            background: 'white',
          }}
        >
          <option value="all">All Levels</option>
          <option value="newbie">🌱 Newbie</option>
          <option value="bronze">🥉 Bronze</option>
          <option value="silver">🥈 Silver</option>
          <option value="gold">🏆 Gold</option>
          <option value="platinum">🥇 Platinum</option>
          <option value="diamond">💎 Diamond</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #e8f0fe',
            fontSize: 13,
            fontWeight: 600,
            color: '#102a56',
            cursor: 'pointer',
            background: 'white',
          }}
        >
          <option value="recent">Most Recent</option>
          <option value="sessions">Most Sessions</option>
          <option value="accuracy">Highest Accuracy</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: 12, fontSize: 13, color: '#5a6b8c' }}>
        Showing <strong style={{ color: '#102a56' }}>{filteredUsers.length}</strong> of{' '}
        <strong style={{ color: '#102a56' }}>{users.length}</strong> users
      </div>

      {/* Users Table */}
      <div style={{
        background: 'white',
        padding: 24,
        borderRadius: 16,
        border: '1px solid #e8f0fe',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: '4px solid #e8f0fe',
                borderTopColor: '#1e6ef5',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <p style={{ color: '#5a6b8c' }}>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🔍</div>
            <p style={{ color: '#8a9ab5', fontSize: 15 }}>
              No users match your filters
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e8f0fe' }}>
                  <th style={{ padding: 12, textAlign: 'left', color: '#5a6b8c', fontWeight: 600 }}>User</th>
                  <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Level</th>
                  <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Sessions</th>
                  <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Accuracy</th>
                  <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Questions</th>
                  <th style={{ padding: 12, textAlign: 'left', color: '#5a6b8c', fontWeight: 600 }}>Favorite Game</th>
                  <th style={{ padding: 12, textAlign: 'left', color: '#5a6b8c', fontWeight: 600 }}>Last Active</th>
                  <th style={{ padding: 12, textAlign: 'center', color: '#5a6b8c', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const favInfo = u.favorite_game ? GAME_INFO[u.favorite_game] : null;
                  const accColor = getAccColor(u.accuracy);
                  const level = getLevelBadge(u.sessions);

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* User */}
                      <td style={{ padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #1e6ef5, #a855f7)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 14,
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {u.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#102a56', display: 'flex', alignItems: 'center', gap: 6 }}>
                              {u.username}
                              {!u.is_active && (
                                <span style={{
                                  fontSize: 9, padding: '2px 6px', borderRadius: 4,
                                  background: '#fee2e2', color: '#dc2626', fontWeight: 700,
                                }}>
                                  INACTIVE
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: '#8a9ab5' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Level */}
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: 8,
                          background: level.bg,
                          color: level.color,
                          fontSize: 11,
                          fontWeight: 700,
                        }}>
                          {level.emoji} {level.label}
                        </span>
                      </td>

                      {/* Sessions */}
                      <td style={{ padding: 12, textAlign: 'center', fontWeight: 700, color: '#102a56' }}>
                        {u.sessions}
                      </td>

                      {/* Accuracy */}
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          {u.accuracy >= 70 ? (
                            <TrendingUp size={14} color={accColor} />
                          ) : u.accuracy >= 50 ? (
                            <Target size={14} color={accColor} />
                          ) : (
                            <TrendingDown size={14} color={accColor} />
                          )}
                          <span style={{ fontWeight: 800, color: accColor }}>
                            {u.accuracy}%
                          </span>
                        </div>
                      </td>

                      {/* Questions */}
                      <td style={{ padding: 12, textAlign: 'center', color: '#5a6b8c' }}>
                        {u.total_questions}
                      </td>

                      {/* Favorite Game */}
                      <td style={{ padding: 12, fontSize: 12 }}>
                        {favInfo ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 16 }}>{favInfo.emoji}</span>
                            <span style={{ color: '#102a56', fontWeight: 600 }}>{favInfo.name}</span>
                          </span>
                        ) : (
                          <span style={{ color: '#8a9ab5' }}>—</span>
                        )}
                      </td>

                      {/* Last Active */}
                      <td style={{ padding: 12, fontSize: 11, color: '#5a6b8c' }}>
                        {u.last_active === 'Never' ? (
                          <span style={{ color: '#8a9ab5' }}>Never</span>
                        ) : (
                          <span>{u.last_active}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button
                            onClick={() => openUserDetail(u.id)}
                            title="View details"
                            style={{
                              padding: 6,
                              background: '#e8f0fe',
                              color: '#1e6ef5',
                              border: 'none',
                              borderRadius: 6,
                              cursor: 'pointer',
                            }}
                          >
                            <Activity size={14} />
                          </button>
                          <button
                            onClick={() => toggleUserActive(u.id, u.is_active)}
                            title={u.is_active ? 'Deactivate' : 'Activate'}
                            style={{
                              padding: 6,
                              background: u.is_active ? '#fee2e2' : '#d1fae5',
                              color: u.is_active ? '#dc2626' : '#059669',
                              border: 'none',
                              borderRadius: 6,
                              cursor: 'pointer',
                            }}
                          >
                            {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                          <button
                            onClick={() => deleteUser(u.id, u.username)}
                            title="Delete"
                            style={{
                              padding: 6,
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: 'none',
                              borderRadius: 6,
                              cursor: 'pointer',
                            }}
                          >
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
        )}
      </div>

      {/* ============ USER DETAIL MODAL ============ */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeUserDetail}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: 20,
                padding: 32,
                maxWidth: 750,
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
              }}
            >
              {!userDetail ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      border: '4px solid #e8f0fe',
                      borderTopColor: '#1e6ef5',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      margin: '0 auto 16px',
                    }}
                  />
                  <p style={{ color: '#5a6b8c' }}>Loading user details...</p>
                </div>
              ) : (
                <>
                  {/* Modal Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 24,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #1e6ef5, #a855f7)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 26,
                          fontWeight: 800,
                        }}
                      >
                        {userDetail.user.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2
                          style={{
                            fontFamily: 'Manrope',
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            color: '#102a56',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          {userDetail.user.username}
                          {userDetail.user.role === 'admin' && (
                            <span
                              style={{
                                fontSize: 10,
                                padding: '3px 8px',
                                borderRadius: 6,
                                background: '#fef3c7',
                                color: '#b45309',
                                fontWeight: 700,
                              }}
                            >
                              👑 ADMIN
                            </span>
                          )}
                        </h2>
                        <p style={{ fontSize: 13, color: '#5a6b8c', margin: '4px 0 0' }}>
                          {userDetail.user.email}
                        </p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: userDetail.user.is_active ? '#d1fae5' : '#fee2e2',
                              color: userDetail.user.is_active ? '#059669' : '#dc2626',
                            }}
                          >
                            {userDetail.user.is_active ? '✅ Active' : '❌ Inactive'}
                          </span>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: '#f1f5f9',
                              color: '#64748b',
                            }}
                          >
                            📅 {userDetail.user.created_at}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={closeUserDetail}
                      style={{
                        padding: 8,
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Stats Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 12,
                      marginBottom: 24,
                    }}
                  >
                    <div
                      style={{
                        padding: 16,
                        background: '#eff6ff',
                        borderRadius: 12,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 26, fontWeight: 800, color: '#1e6ef5' }}>
                        {userDetail.stats.total_sessions}
                      </div>
                      <div style={{ fontSize: 11, color: '#5a6b8c', marginTop: 2 }}>
                        Sessions
                      </div>
                    </div>
                    <div
                      style={{
                        padding: 16,
                        background: '#f0fdf4',
                        borderRadius: 12,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 26, fontWeight: 800, color: '#10b981' }}>
                        {userDetail.stats.avg_accuracy}%
                      </div>
                      <div style={{ fontSize: 11, color: '#5a6b8c', marginTop: 2 }}>
                        Accuracy
                      </div>
                    </div>
                    <div
                      style={{
                        padding: 16,
                        background: '#f5f3ff',
                        borderRadius: 12,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 26, fontWeight: 800, color: '#a855f7' }}>
                        {userDetail.stats.total_questions}
                      </div>
                      <div style={{ fontSize: 11, color: '#5a6b8c', marginTop: 2 }}>
                        Questions
                      </div>
                    </div>
                    <div
                      style={{
                        padding: 16,
                        background: '#fef3c7',
                        borderRadius: 12,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 26, fontWeight: 800, color: '#f59e0b' }}>
                        {userDetail.stats.correct_answers}
                      </div>
                      <div style={{ fontSize: 11, color: '#5a6b8c', marginTop: 2 }}>
                        Correct
                      </div>
                    </div>
                  </div>

                  {/* Games Played */}
                  {userDetail.game_stats.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h4
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#102a56',
                          marginBottom: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        🎮 Games Played
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {userDetail.game_stats.map((g, i) => {
                          const info = GAME_INFO[g.game_type] || {
                            name: g.game_type,
                            emoji: '🎮',
                            color: '#5a6b8c',
                          };
                          return (
                            <div
                              key={i}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: 12,
                                background: '#f8faff',
                                borderRadius: 10,
                                border: '1px solid #e8f0fe',
                              }}
                            >
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 10,
                                  background: `${info.color}15`,
                                  color: info.color,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 18,
                                  flexShrink: 0,
                                }}
                              >
                                {info.emoji}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: '#102a56',
                                  }}
                                >
                                  {info.name}
                                </div>
                                <div style={{ fontSize: 11, color: '#5a6b8c' }}>
                                  {g.sessions} sessions
                                </div>
                              </div>
                              <div
                                style={{
                                  fontWeight: 800,
                                  color: getAccColor(g.accuracy),
                                  fontSize: 16,
                                }}
                              >
                                {g.accuracy}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Weak Areas */}
                  {userDetail.weak_areas && userDetail.weak_areas.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h4
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#102a56',
                          marginBottom: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        ⚠️ Weak Areas
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {userDetail.weak_areas.map((w, i) => (
                          <div
                            key={i}
                            style={{
                              padding: 12,
                              background: '#fef2f2',
                              borderRadius: 10,
                              border: '1px solid #fecaca',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 6,
                                fontSize: 13,
                              }}
                            >
                              <span style={{ fontWeight: 600, color: '#102a56' }}>
                                {w.contrast}
                              </span>
                              <span style={{ fontWeight: 800, color: '#ef4444' }}>
                                {w.accuracy}%
                              </span>
                            </div>
                            <div
                              style={{
                                height: 6,
                                background: 'white',
                                borderRadius: 3,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${w.accuracy}%`,
                                  background: '#ef4444',
                                  borderRadius: 3,
                                }}
                              />
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: '#5a6b8c',
                                marginTop: 4,
                              }}
                            >
                              {w.attempts} attempts
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Sessions */}
                  {userDetail.recent_sessions.length > 0 && (
                    <div>
                      <h4
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#102a56',
                          marginBottom: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        📅 Recent Sessions
                      </h4>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          maxHeight: 300,
                          overflowY: 'auto',
                        }}
                      >
                        {userDetail.recent_sessions.map((s, i) => {
                          const info = GAME_INFO[s.game_type] || {
                            name: s.game_type,
                            emoji: '🎮',
                          };
                          const accColor = getAccColor(s.accuracy);
                          return (
                            <div
                              key={i}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: 10,
                                background: '#f8faff',
                                borderRadius: 8,
                                border: '1px solid #e8f0fe',
                                fontSize: 12,
                              }}
                            >
                              <span style={{ fontSize: 18 }}>{info.emoji}</span>
                              <span
                                style={{
                                  flex: 1,
                                  color: '#102a56',
                                  fontWeight: 600,
                                }}
                              >
                                {info.name}
                              </span>
                              <span style={{ fontSize: 11, color: '#8a9ab5' }}>
                                {s.date}
                              </span>
                              <span
                                style={{
                                  fontWeight: 800,
                                  color: accColor,
                                  minWidth: 40,
                                  textAlign: 'right',
                                }}
                              >
                                {s.accuracy}%
                              </span>
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
    </AdminLayout>
  );
}