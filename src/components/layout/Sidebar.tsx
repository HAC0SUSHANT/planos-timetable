import React from 'react';
import type { NavigationSection } from '../../context/AppContext';
import { useApp } from '../../context/AppContext';
import { 
  SunMedium, 
  Calendar, 
  Target, 
  Flame, 
  BarChart3, 
  BookOpen, 
  FileText, 
  FolderArchive, 
  Bot, 
  Settings, 
  X,
  Compass
} from 'lucide-react';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: NavigationSection;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  badge?: number | string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const { currentView, setCurrentView, tasks, goals } = useApp();

  const pendingCount = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
  const activeGoalsCount = goals.filter(g => g.status === 'active').length;

  const navItems: NavItem[] = [
    { id: 'today', label: 'Today', icon: SunMedium, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'goals', label: 'Goals', icon: Target, badge: activeGoalsCount > 0 ? activeGoalsCount : undefined },
    { id: 'habits', label: 'Habits', icon: Flame },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'study', label: 'Study', icon: BookOpen },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'files', label: 'Files', icon: FolderArchive },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelect = (id: NavigationSection) => {
    setCurrentView(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(2px)',
            zIndex: 900,
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        style={{
          width: '260px',
          height: '100vh',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 950,
          transition: 'transform var(--transition-normal)',
          position: isOpenMobile ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          transform: isOpenMobile || window.innerWidth > 768 ? 'translateX(0)' : 'translateX(-100%)',
        }}
        className="app-sidebar"
      >
        {/* App Logo & Philosophy Tagline */}
        <div
          style={{
            padding: 'var(--space-lg) var(--space-md)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Compass size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                PlanOS
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Personal Execution
              </div>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            className="btn-icon mobile-only"
            onClick={onCloseMobile}
            aria-label="Close menu"
            style={{ display: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Core Loop Indicator */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span style={{ color: 'var(--accent-text)', fontWeight: 600 }}>LOOP:</span> PLAN → EXECUTE → TRACK → ADAPT
        </div>

        {/* Navigation Links */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-md) var(--space-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
                  color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all var(--transition-fast)',
                  position: 'relative',
                }}
                className={`nav-btn ${isActive ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={18} style={{ color: isActive ? 'var(--accent-text)' : 'var(--text-muted)' }} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      backgroundColor: isActive ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                      color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom User / System Status Bar */}
        <div
          style={{
            padding: 'var(--space-md)',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-input)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--success)',
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>System Active</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>v1.0-alpha</span>
        </div>
      </aside>
    </>
  );
};
