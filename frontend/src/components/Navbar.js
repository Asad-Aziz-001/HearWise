import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { getUser, logout } from '../utils/auth';

export default function Navbar() {
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="lp-navbar">
      <div className="lp-navbar-inner">
        <Link to={user ? '/dashboard' : '/'} className="lp-logo">
          <svg width="38" height="38" viewBox="0 0 48 48" fill="none">
            <path d="M14 20V28M10 22V26M18 17V31M22 14V34M26 12V36M30 16V32M34 20V28M38 22V26"
                  stroke="#1e6ef5" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="lp-logo-text">HearWise</span>
        </Link>

        {user && (
          <div className="lp-nav-links">
            <Link to="/dashboard"
                  className={`lp-nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
              Dashboard
            </Link>
            <Link to="/game/word_discrimination"
                  className={`lp-nav-link ${location.pathname.startsWith('/game') ? 'active' : ''}`}>
              Play
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin"
                    className={`lp-nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
                Admin
              </Link>
            )}
          </div>
        )}

        <div className="lp-nav-actions">
          {user ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 10,
                background: '#f5f8ff', fontSize: 14, fontWeight: 600,
                color: 'var(--text-heading)'
              }}>
                <User size={16} />
                {user.username}
              </div>
              <button onClick={handleLogout} className="lp-btn-login"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="lp-btn-login">Login</Link>
              <Link to="/register" className="lp-btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}