import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  stageNote?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  stageNote,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-2xl) var(--space-lg)',
        border: '1px dashed var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'rgba(255, 255, 255, 0.01)',
        margin: 'var(--space-lg) 0',
      }}
    >
      {icon && (
        <div
          style={{
            fontSize: '2rem',
            color: 'var(--text-muted)',
            marginBottom: 'var(--space-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {icon}
        </div>
      )}
      <h3 style={{ marginBottom: 'var(--space-xs)', color: 'var(--text-primary)' }}>{title}</h3>
      {description && (
        <p
          style={{
            maxWidth: '440px',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-md)',
          }}
        >
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button className="btn btn-primary" onClick={onAction} style={{ marginTop: 'var(--space-xs)' }}>
          {actionText}
        </button>
      )}
      {stageNote && (
        <div
          style={{
            marginTop: 'var(--space-md)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {stageNote}
        </div>
      )}
    </div>
  );
};
