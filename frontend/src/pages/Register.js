import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { setAuth } from '../utils/auth';
import HeroIllustration from '../components/HeroIllustration';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Register
      await api.post('/auth/register', { username, email, password });

      // 2. Auto-login after register
      const loginResponse = await api.post('/auth/login', { email, password });
      const loginData = loginResponse.data;

      // 3. Validate
      if (!loginData.token || !loginData.user) {
        toast.error('Registration succeeded but login failed');
        navigate('/login');
        return;
      }

      // 4. Save to sessionStorage
      setAuth(loginData.token, loginData.user);

      // 5. Success + redirect
      toast.success(`Welcome to HearWise, ${loginData.user.username}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Registration failed. Try again.';
      toast.error(msg);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-page">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-split-card"
      >
        {/* LEFT SIDE */}
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
              Start Your Journey<br />
              to Better Listening
            </h2>
            <p className="auth-left-subtext">
              Join thousands of learners improving their listening skills through play.
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

        {/* RIGHT SIDE */}
        <div className="auth-right">
          <h1 className="auth-right-title">Create Account</h1>
          <p className="auth-right-subtitle">Start your auditory training journey</p>

          <form onSubmit={submit}>
            {/* Username */}
            <div className="auth-field">
              <label className="auth-label">Username</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                />
              </div>
            </div>

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
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}