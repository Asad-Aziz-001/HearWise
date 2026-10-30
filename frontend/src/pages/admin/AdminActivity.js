import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, RefreshCw, Zap, Clock, Users, TrendingUp,
  Filter, Calendar, Volume2, Play, Gamepad2, Flame
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  AreaChart, Area, CartesianGrid
} from 'recharts';
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

const GAME_FILTERS = [
  { id: 'all', label: 'All Games', emoji: '🎮' },
  { id: 'similar', label: 'Similar', emoji: '🎧' },
  { id: 'sequence', label: 'Sequence', emoji: '🧠' },
  { id: 'tone_discrimination', label: 'Tone', emoji: '🎵' },
  { id: 'rhyme_match', label: 'Rhyme', emoji: '🎼' },
  { id: 'pronunciation', label: 'Pronunciation', emoji: '🎤' },
];

function formatDuration(sec) {
  if (!sec) return '—';
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  return `${min}m ${s}s`;
}

function timeAgo(isoString) {
  if (!isoString) return '';
  const now = new Date();
  const then = new Date(isoString);
  const diff = Math.floor((now - then) / 1000);
  
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminActivity() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [filterGame, setFilterGame] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [newSessionCount, setNewSessionCount] = useState(0);
  const lastSessionIdRef = useRef(null);

  // ✅ REALTIME: Auto-refresh every 5 seconds
  useEffect(() => {
    loadData();
    
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setRefreshing(true);
    
    try {
      const { data: resp } = await api.get('/admin/live-activity');
      
      // Detect new sessions
      if (lastSessionIdRef.current && resp.feed.length > 0) {
        const newestId = resp.feed[0].id;
        if (newestId !== lastSessionIdRef.current) {
          const newCount = resp.feed.findIndex(s => s.id === lastSessionIdRef.current);
          setNewSessionCount(newCount >= 0 ? newCount : 1);
          setTimeout(() => setNewSessionCount(0), 3000);
        }
      }
      
      if (resp.feed.length > 0) {
        lastSessionIdRef.current = resp.feed[0].id;
      }
      
      setData(resp);
      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter feed
  const filteredFeed = data?.feed?.filter(
    (s) => filterGame === 'all' || s.game_type === filterGame
  ) || [];

  if (loading) {
    return (
      <AdminLayout>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          gap: 16,
        }}>
          <div style={{
            width: 50,
            height: 50,
            border: '4px solid #e8f0fe',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ color: '#5a6b8c' }}>Loading live activity...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </AdminLayout>
    );
  }

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
            <Activity size={32} color="#10b981" /> Live Activity
          </h1>
          <p style={{ fontSize: 14, color: '#5a6b8c', margin: '4px 0 0' }}>
            Real-time game sessions from all users
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Live indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 10,
            background: autoRefresh ? '#f0fdf4' : '#f1f5f9',
            border: `1px solid ${autoRefresh ? '#d1fae5' : '#e2e8f0'}`,
            fontSize: 12,
            fontWeight: 600,
            color: autoRefresh ? '#059669' : '#64748b',
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: autoRefresh ? '#10b981' : '#94a3b8',
              animation: autoRefresh ? 'pulse 2s infinite' : 'none',
            }} />
            {autoRefresh ? 'Live' : 'Paused'} · {lastUpdate.toLocaleTimeString()}
          </div>

          {/* Pause/Resume */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 10,
              background: autoRefresh ? '#fef3c7' : '#f0fdf4',
              border: `1px solid ${autoRefresh ? '#fde68a' : '#d1fae5'}`,
              color: autoRefresh ? '#b45309' : '#059669',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {autoRefresh ? '⏸️ Pause' : '▶️ Resume'}
          </button>

          {/* Refresh */}
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
            <RefreshCw
              size={14}
              style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* New session banner */}
      <AnimatePresence>
        {newSessionCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              padding: 12,
              marginBottom: 16,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
          >
            <Zap size={18} /> {newSessionCount} new session{newSessionCount > 1 ? 's' : ''} just completed!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
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
            borderLeft: '4px solid #10b981',
          }}
        >
          <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 4 }}>Sessions Today</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#10b981' }}>
            {data?.stats?.today || 0}
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
            borderLeft: '4px solid #1e6ef5',
          }}
        >
          <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 4 }}>This Hour</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#1e6ef5' }}>
            {data?.stats?.this_hour || 0}
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
            borderLeft: '4px solid #f59e0b',
          }}
        >
          <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 4 }}>Last Minute</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b' }}>
            {data?.stats?.this_minute || 0}
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
            borderLeft: '4px solid #a855f7',
          }}
        >
          <div style={{ fontSize: 13, color: '#5a6b8c', marginBottom: 4 }}>Active Today</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#a855f7' }}>
            {data?.top_users?.length || 0}
          </div>
        </motion.div>
      </div>

      {/* Row 2: Hourly Chart + Top Users */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 20,
        marginBottom: 24,
      }}>
        {/* Hourly chart */}
        <div style={{
          background: 'white',
          padding: 24,
          borderRadius: 16,
          border: '1px solid #e8f0fe',
        }}>
          <h3 style={{
            fontFamily: 'Manrope',
            fontSize: '1rem',
            fontWeight: 700,
            color: '#102a56',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <TrendingUp size={20} color="#10b981" /> Hourly Activity (Last 24h)
          </h3>
          {data?.hourly && data.hourly.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.hourly}>
                <defs>
                  <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: '#8a9ab5' }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#8a9ab5' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e8f0fe',
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#activityGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ fontSize: 13, color: '#8a9ab5', textAlign: 'center', padding: 40 }}>
              No activity data
            </p>
          )}
        </div>

        {/* Top Active Users */}
        <div style={{
          background: 'white',
          padding: 24,
          borderRadius: 16,
          border: '1px solid #e8f0fe',
        }}>
          <h3 style={{
            fontFamily: 'Manrope',
            fontSize: '1rem',
            fontWeight: 700,
            color: '#102a56',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Flame size={20} color="#f59e0b" /> Top Active Today
          </h3>
          {data?.top_users && data.top_users.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.top_users.map((u, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: 10,
                    background: '#f8faff',
                    borderRadius: 10,
                    border: '1px solid #e8f0fe',
                  }}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: ['#fbbf24', '#94a3b8', '#f97316', '#60a5fa', '#a78bfa'][i],
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 12,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#102a56' }}>
                    {u.username}
                  </div>
                  <div style={{
                    padding: '2px 8px',
                    background: '#d1fae5',
                    color: '#059669',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                  }}>
                    {u.sessions}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#8a9ab5', textAlign: 'center', padding: 40 }}>
              No active users today
            </p>
          )}
        </div>
      </div>

      {/* Game Filter Pills */}
      <div style={{
        background: 'white',
        padding: 16,
        borderRadius: 16,
        border: '1px solid #e8f0fe',
        marginBottom: 16,
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        flexWrap: 'wrap',
      }}>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#5a6b8c',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginRight: 8,
        }}>
          <Filter size={14} /> Filter:
        </div>
        {GAME_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterGame(f.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              background: filterGame === f.id ? '#1e6ef5' : '#f1f5f9',
              color: filterGame === f.id ? 'white' : '#5a6b8c',
              border: 'none',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      {/* Live Feed */}
      <div style={{
        background: 'white',
        padding: 24,
        borderRadius: 16,
        border: '1px solid #e8f0fe',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <h3 style={{
            fontFamily: 'Manrope',
            fontSize: '1rem',
            fontWeight: 700,
            color: '#102a56',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Activity size={20} /> Live Feed
            <span style={{
              padding: '2px 10px',
              background: '#d1fae5',
              color: '#059669',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 700,
            }}>
              {filteredFeed.length} sessions
            </span>
          </h3>
        </div>

        {filteredFeed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>📡</div>
            <p style={{ color: '#8a9ab5', fontSize: 15 }}>
              {filterGame === 'all'
                ? 'No activity yet'
                : 'No activity for this game type'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredFeed.map((session, i) => {
              const info = GAME_INFO[session.game_type] || {
                name: session.game_type,
                emoji: '🎮',
                color: '#5a6b8c',
              };
              const accColor =
                session.accuracy >= 70 ? '#10b981' :
                session.accuracy >= 50 ? '#f59e0b' : '#ef4444';

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.5) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 16,
                    background: i === 0 ? '#f0fdf4' : '#f8faff',
                    borderRadius: 12,
                    border: i === 0 ? '2px solid #10b981' : '1px solid #e8f0fe',
                    position: 'relative',
                  }}
                >
                  {/* Live badge on newest */}
                  {i === 0 && (
                    <div style={{
                      position: 'absolute',
                      top: -8,
                      left: 16,
                      padding: '2px 8px',
                      background: '#10b981',
                      color: 'white',
                      borderRadius: 6,
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}>
                      NEW
                    </div>
                  )}

                  {/* User Avatar */}
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1e6ef5, #a855f7)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}>
                    {session.user_initial}
                  </div>

                  {/* User Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#102a56',
                      marginBottom: 2,
                    }}>
                      {session.user}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                      color: '#5a6b8c',
                      flexWrap: 'wrap',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {info.emoji} {info.name}
                      </span>
                      <span>·</span>
                      <span style={{ textTransform: 'capitalize' }}>
                        {session.difficulty}
                      </span>
                      <span>·</span>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <Clock size={11} />
                        {timeAgo(session.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Duration */}
                  <div style={{
                    textAlign: 'center',
                    padding: '6px 12px',
                    background: 'white',
                    borderRadius: 8,
                    border: '1px solid #e8f0fe',
                    fontSize: 11,
                    color: '#5a6b8c',
                    fontWeight: 600,
                    minWidth: 60,
                  }}>
                    ⏱️<br />
                    <span style={{ fontSize: 10 }}>
                      {formatDuration(session.duration)}
                    </span>
                  </div>

                  {/* Accuracy */}
                  <div style={{
                    textAlign: 'center',
                    padding: '8px 16px',
                    background: accColor === '#10b981' ? '#d1fae5' :
                              accColor === '#f59e0b' ? '#fef3c7' : '#fee2e2',
                    borderRadius: 10,
                    minWidth: 80,
                  }}>
                    <div style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: accColor,
                      lineHeight: 1,
                    }}>
                      {session.accuracy}%
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: '#5a6b8c',
                      marginTop: 2,
                    }}>
                      {session.correct_answers}/{session.total_questions}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>
    </AdminLayout>
  );
}