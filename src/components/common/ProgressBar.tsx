import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  height?: number;
  showLabel?: boolean;
  color?: string;
  hasEnoughData?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  height = 8,
  showLabel = false,
  color,
  hasEnoughData = true,
}) => {
  if (!hasEnoughData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            flex: 1,
            height: `${height}px`,
            backgroundColor: 'var(--border-subtle)',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not enough data</span>
      </div>
    );
  }

  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
      <div
        style={{
          flex: 1,
          height: `${height}px`,
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '9999px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            backgroundColor: color || 'var(--accent-primary)',
            borderRadius: '9999px',
            transition: 'width 300ms ease-out',
          }}
        />
      </div>
      {showLabel && (
        <span
          style={{
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            minWidth: '40px',
            textAlign: 'right',
          }}
        >
          {clamped}%
        </span>
      )}
    </div>
  );
};
