import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import HeroIllustration from '../components/HeroIllustration';
import { setAuth } from '../utils/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });

      // ✅ Validate response
      if (!data.token || !data.user) {
        toast.error('Invalid response from server');
        return;
      }

      // ... 
      setAuth(data.token, data.user);


      // ✅ Admin auto-redirect to /admin
      if (data.user.role === 'admin') {
        toast.success(`👑 Welcome, ${data.user.username}!`, {
          duration: 3000,
        });
        navigate('/admin');
      } else {
        // Regular user → dashboard
        toast.success(`Welcome back, ${data.user.username}!`);
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Invalid email or password';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };



  const handleForgotPassword = () => {
    toast('📧 Contact your admin to reset password', {
      icon: 'ℹ️',
      duration: 4000,
    });
  };

  return (
    <div className="auth-split-page">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-split-card"
      >
        {/* ============ LEFT SIDE — Logo + Girl ============ */}
        <div className="auth-left">
          <div>
            <Link to="/" className="auth-left-logo">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path
                  d="M14 20V28M10 22V26M18 17V31M22 14V34M26 12V36M30 16V32M34 20V28M38 22V26"
                  stroke="#1e6ef5"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <div>
                <div className="auth-left-logo-text">HearWise</div>
                <div className="auth-left-tagline">Listen · Practice · Improve</div>
              </div>
            </Link>

            <h2 className="auth-left-heading">
              Better Listening<br />
              Builds Brighter Futures
            </h2>
            <p className="auth-left-subtext">
              Fun, game-based listening practice with personalized learning paths.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="auth-left-illustration"
          >
            <HeroIllustration size={360} />
          </motion.div>
        </div>

        {/* ============ RIGHT SIDE — Form ============ */}
        <div className="auth-right">
          <h1 className="auth-right-title">Welcome Back</h1>
          <p className="auth-right-subtitle">Sign in to continue your journey</p>

          <form onSubmit={submit}>
            {/* Email */}
            <div className="auth-field">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 46 }}
                />
                <button
                  type="button"
                  className="auth-input-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="auth-options">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="auth-forgot"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#1e6ef5',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p className="auth-switch-text">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}