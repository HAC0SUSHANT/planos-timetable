import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { ProgressBar } from '../common/ProgressBar';
import { TimerWidget } from '../timer/TimerWidget';
import { Sun, Moon, Plus, Menu } from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { theme, toggleTheme } = useTheme();
  const { progress, setIsQuickAddOpen, currentView } = useApp();

  // Formatted date string (e.g. "Friday, 2 October")
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Time-based greeting
  const getGreeting = () => {
    const hours = today.getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header
      style={{
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: 'var(--space-md) var(--space-xl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-md)',
      }}
    >
      {/* Left: Mobile hamburger & Greeting / Date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <button
          className="btn-icon mobile-toggle-btn"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
          style={{ display: 'none' }}
        >
          <Menu size={20} />
        </button>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
                color: 'var(--accent-text)',
              }}
            >
              {currentView.toUpperCase()}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formattedDate}</span>
          </div>

          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
            {getGreeting()}, Sushant
          </h1>
        </div>
      </div>

      {/* Center: Daily Progress Bar Widget */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minWidth: '240px',
          maxWidth: '320px',
          flex: 1,
        }}
        className="header-progress-widget"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Daily progress
          </span>
          <span
            style={{
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: progress?.hasEnoughData ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            {progress?.hasEnoughData ? (
              `${progress.completedTasks}/${progress.totalTasks} completed (${progress.completionRate}%)`
            ) : (
              'No tasks scheduled'
            )}
          </span>
        </div>
        <ProgressBar
          value={progress?.completionRate || 0}
          height={6}
          hasEnoughData={progress?.hasEnoughData ?? false}
        />
      </div>

      {/* Right: Quick Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        {/* Persistent Focus Timer Widget */}
        <TimerWidget />

        {/* Quick Add Button */}
        <button className="btn btn-primary" onClick={() => setIsQuickAddOpen(true)}>
          <Plus size={16} />
          <span>Quick Add</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          className="btn-icon"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};
