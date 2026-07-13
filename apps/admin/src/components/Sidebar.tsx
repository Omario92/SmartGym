import { NavLink } from 'react-router-dom';
import { Dumbbell, LayoutDashboard, FileText, Settings, LogOut } from 'lucide-react';
import logoImg from '../assets/logo-smart-gym-plus-2.png';

interface SidebarProps {
  userEmail: string;
  onLogout: () => void;
}

export default function Sidebar({ userEmail, onLogout }: SidebarProps) {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoArea}>
        <img src={logoImg} alt="SmartGym Plus Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }} />
        <span style={styles.logoText}>
          SmartGym Plus <span style={styles.logoBadge}>ADMIN</span>
        </span>
      </div>

      <nav style={styles.nav}>
        <NavLink 
          to="/" 
          end
          style={({ isActive }) => ({
            ...styles.navLink,
            ...(isActive ? styles.navLinkActive : {})
          })}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/exercises" 
          style={({ isActive }) => ({
            ...styles.navLink,
            ...(isActive ? styles.navLinkActive : {})
          })}
        >
          <Dumbbell size={18} />
          <span>Exercise Catalog</span>
        </NavLink>

        <NavLink 
          to="/routines" 
          style={({ isActive }) => ({
            ...styles.navLink,
            ...(isActive ? styles.navLinkActive : {})
          })}
        >
          <FileText size={18} />
          <span>Routine Templates</span>
        </NavLink>

        <NavLink 
          to="/settings" 
          style={({ isActive }) => ({
            ...styles.navLink,
            ...(isActive ? styles.navLinkActive : {})
          })}
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div style={styles.footer}>
        <div style={styles.userInfo}>
          <div style={styles.userDot}></div>
          <span style={styles.userEmail} title={userEmail}>
            {userEmail}
          </span>
        </div>
        <button onClick={onLogout} style={styles.logoutBtn} className="btn">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    position: 'sticky' as const,
    top: 0,
  },
  logoArea: {
    padding: '2rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    borderBottom: '1px solid var(--border)',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    fontSize: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  logoBadge: {
    fontSize: '0.625rem',
    backgroundColor: 'rgba(0, 255, 157, 0.1)',
    color: 'var(--accent)',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    border: '1px solid rgba(0, 255, 157, 0.2)',
    fontWeight: '600',
  },
  nav: {
    flex: 1,
    padding: '2rem 1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  navLinkActive: {
    backgroundColor: 'rgba(0, 255, 157, 0.05)',
    color: 'var(--accent)',
    borderLeft: '3px solid var(--accent)',
    paddingLeft: 'calc(1rem - 3px)',
  },
  footer: {
    padding: '1.5rem',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  userDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent)',
  },
  userEmail: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '180px',
  },
  logoutBtn: {
    width: '100%',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    padding: '0.5rem 1rem',
    fontSize: '0.8125rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
