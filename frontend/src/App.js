import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import api from './utils/api';
import { getUser } from './utils/auth';

// ============ PUBLIC PAGES ============
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// ============ USER PAGES ============
import Dashboard from './pages/Dashboard';
import GamesMenu from './pages/GamesMenu';
import SimilarGame from './pages/SimilarGame';
import SequenceGame from './pages/SequenceGame';
import ToneDiscrimination from './pages/ToneDiscrimination';
import RhymeMatch from './pages/RhymeMatch';
import WordPosition from './pages/WordPosition';
import WordChainMemory from './pages/WordChainMemory';
import PhonemeReplacement from './pages/PhonemeReplacement';
import AudioStory from './pages/AudioStory';
import PronunciationScoring from './pages/PronunciationScoring';
import EmotionDetection from './pages/EmotionDetection';
import WordInNoise from './pages/WordInNoise';
import AILab from './pages/AILab';
import Progress from './pages/Progress';
import ReportPage from './pages/ReportPage';
import SpeechPractice from './pages/SpeechPractice';

// ============ ADMIN PAGES ============
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminActivity from './pages/admin/AdminActivity';
import AdminContent from './pages/admin/AdminContent';
import AdminReports from './pages/admin/AdminReports';

// ============ PROTECTED ROUTE ============
function ProtectedRoute({ children, adminOnly = false }) {
  const [status, setStatus] = useState('verifying');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = getUser();

    if (!token || !savedUser) {
      setStatus('invalid');
      return;
    }

    api.get('/auth/me')
      .then(response => {
        const freshUser = response.data;
        localStorage.setItem('user', JSON.stringify(freshUser));
        setUser(freshUser);
        setStatus('valid');
      })
      .catch(err => {
        console.warn('Token invalid:', err.response?.status);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setStatus('invalid');
      });
  }, []);

  if (status === 'verifying') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: 16,
        background: '#f5f8ff',
      }}>
        <div style={{
          width: 40, height: 40,
          border: '4px solid #e8f0fe',
          borderTopColor: '#1e6ef5',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#5a6b8c', fontSize: 14 }}>🔒 Verifying session...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === 'invalid') {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// ============ APP ============
function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: 12, background: '#1f2937', color: 'white' },
          success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
          error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
        }}
      />
      <Routes>
        {/* ============ PUBLIC ROUTES ============ */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ============ USER PROTECTED ROUTES ============ */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/games" element={
          <ProtectedRoute><GamesMenu /></ProtectedRoute>
        } />
        <Route path="/game/similar" element={
          <ProtectedRoute><SimilarGame /></ProtectedRoute>
        } />
        <Route path="/game/sequence" element={
          <ProtectedRoute><SequenceGame /></ProtectedRoute>
        } />
        <Route path="/game/tone" element={
          <ProtectedRoute><ToneDiscrimination /></ProtectedRoute>
        } />
        <Route path="/game/rhyme" element={
          <ProtectedRoute><RhymeMatch /></ProtectedRoute>
        } />
        <Route path="/game/position" element={
          <ProtectedRoute><WordPosition /></ProtectedRoute>
        } />
        <Route path="/game/chain" element={
          <ProtectedRoute><WordChainMemory /></ProtectedRoute>
        } />
        <Route path="/game/phoneme" element={
          <ProtectedRoute><PhonemeReplacement /></ProtectedRoute>
        } />
        <Route path="/game/story" element={
          <ProtectedRoute><AudioStory /></ProtectedRoute>
        } />
        <Route path="/game/pronunciation" element={
          <ProtectedRoute><PronunciationScoring /></ProtectedRoute>
        } />
        <Route path="/game/emotion" element={
          <ProtectedRoute><EmotionDetection /></ProtectedRoute>
        } />
        <Route path="/game/noise" element={
          <ProtectedRoute><WordInNoise /></ProtectedRoute>
        } />
        <Route path="/ai-lab" element={
          <ProtectedRoute><AILab /></ProtectedRoute>
        } />
        <Route path="/progress" element={
          <ProtectedRoute><Progress /></ProtectedRoute>
        } />
        <Route path="/report" element={
          <ProtectedRoute><ReportPage /></ProtectedRoute>
        } />

        {/* ============ ADMIN ROUTES (HIDDEN) ============ */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly><AdminOverview /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>
        } />
        <Route path="/admin/activity" element={
          <ProtectedRoute adminOnly><AdminActivity /></ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute adminOnly><AdminReports /></ProtectedRoute>
        } />
        <Route path="/speech-practice" element={
          <ProtectedRoute><SpeechPractice /></ProtectedRoute>
        } />
        <Route path="/admin/content" element={
          <ProtectedRoute adminOnly><AdminContent /></ProtectedRoute>
        } />

        {/* ============ 404 ============ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;