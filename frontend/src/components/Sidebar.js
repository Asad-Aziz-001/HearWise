import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Gamepad2, Brain, Mic, TrendingUp,
  FileText, LogOut
} from 'lucide-react';
import { logout } from '../utils/auth';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Gamepad2, label: 'Games', path: '/games' },
    { icon: Brain, label: 'AI Lab', path: '/ai-lab' },
    { icon: Mic, label: 'Speech Practice', path: '/speech-practice' },
    { icon: TrendingUp, label: 'Progress', path: '/progress' },    // includes predictions
    { icon: FileText, label: 'Report', path: '/report' },          // NEW
  ];

  return (
    <aside className="dash-sidebar">
      <Link to="/" className="dash-sidebar-logo">
        <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
          <path d="M14 20V28M10 22V26M18 17V31M22 14V34M26 12V36M30 16V32M34 20V28M38 22V26"
                stroke="#1e6ef5" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span className="dash-sidebar-logo-text">HearWise</span>
      </Link>

      <nav className="dash-sidebar-nav">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === '/games' && location.pathname.startsWith('/game'));
          return (
            <Link key={item.label} to={item.path} className={`dash-nav-link ${isActive ? 'active' : ''}`}>
              <item.icon size={18} /> <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="dash-sidebar-footer">
        <button className="dash-nav-link" onClick={handleLogout}>
          <LogOut size={18} /> <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}