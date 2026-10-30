import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Activity, FileText, LogOut, Shield,
  BarChart3
} from 'lucide-react';
import { logout, getUser } from '../utils/auth';

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const handleLogout = () => {
    if (window.confirm('Logout from admin panel?')) {
      logout();
      navigate('/login');
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
    { icon: Users, label: 'All Users', path: '/admin/users' },
    { icon: BarChart3, label: 'User Reports', path: '/admin/reports' },
    { icon: Activity, label: 'Live Activity', path: '/admin/activity' },
    { icon: FileText, label: 'Content', path: '/admin/content' },
  ];

  return (
    <aside style={{
      width: 260,
      background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
      borderRight: '1px solid #334155',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      bottom: 0,
      left: 0,
      zIndex: 50,
      overflowY: 'auto',
    }}>
      <Link to="/admin" style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '8px 12px', marginBottom: 20, textDecoration: 'none',
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
        }}>
          <Shield size={22} />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'white', fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.3px' }}>
            HearWise
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Admin Panel
          </div>
        </div>
      </Link>

      <div style={{
        padding: '10px 14px',
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: 10, marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 13, fontWeight: 700,
        }}>
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.username}
          </div>
          <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>
            Administrator
          </div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: 1.5, textTransform: 'uppercase', padding: '0 12px', marginBottom: 8 }}>
          Management
        </div>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 10,
                color: isActive ? 'white' : '#94a3b8',
                background: isActive ? 'linear-gradient(135deg, #1e6ef5, #1554c9)' : 'transparent',
                fontSize: 14, fontWeight: isActive ? 700 : 500,
                textDecoration: 'none', transition: 'all 0.2s',
                boxShadow: isActive ? '0 4px 14px rgba(30, 110, 245, 0.4)' : 'none',
              }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ borderTop: '1px solid #334155', paddingTop: 16, marginTop: 16 }}>
        <button onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderRadius: 10,
            color: '#ef4444', background: 'transparent',
            border: 'none', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
          }}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}