import React from 'react';
import type { Task, Subject } from '../../types';
import { Play, Pause, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { Badge } from '../common/Badge';
import { useTimer } from '../../context/TimerContext';

interface NextTaskCardProps {
  task: Task | null;
  subjects: Subject[];
  onStart: (id: string) => Promise<unknown>;
  onPause: (id: string) => Promise<unknown>;
  onResume: (id: string) => Promise<unknown>;
  onComplete: (id: string) => Promise<unknown>;
  onOpenQuickAdd: () => void;
}

export const NextTaskCard: React.FC<NextTaskCardProps> = ({
  task,
  subjects,
  onStart,
  onPause,
  onResume,
  onComplete,
  onOpenQuickAdd,
}) => {
  const { startTimer, pauseTimer, resumeTimer } = useTimer();

  if (!task) {
    return (
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: '1px solid var(--border-default)',
          padding: 'var(--space-lg)',
          marginBottom: 'var(--space-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-md)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--success-text)' }}>
              Execution Queue Empty
            </span>
          </div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
            No upcoming tasks right now
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            All scheduled items are done or the queue is clear. Plan ahead to maintain continuous momentum.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenQuickAdd}>
          + Schedule Next Task
        </button>
      </div>
    );
  }

  const subject = subjects.find(s => s.id === task.subjectId);
  const isInProgress = task.status === 'in_progress';
  const isPaused = task.status === 'paused';

  const handleStartFocus = async () => {
    await onStart(task.id);
    startTimer({
      mode: 'countdown',
      durationMinutes: task.duration || 45,
      taskId: task.id,
      subjectId: task.subjectId,
      taskTitle: task.title,
    });
  };

  const handlePause = async () => {
    await onPause(task.id);
    pauseTimer();
  };

  const handleResume = async () => {
    await onResume(task.id);
    resumeTimer();
  };

  return (
    <div
      className="card"
      style={{
        border: isInProgress 
          ? '1px solid rgba(59, 130, 246, 0.6)' 
          : isPaused 
          ? '1px solid rgba(245, 158, 11, 0.6)' 
          : '1px solid var(--border-default)',
        background: isInProgress
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, var(--bg-card) 100%)'
          : isPaused
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, var(--bg-card) 100%)'
          : 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)',
        padding: 'var(--space-lg)',
        marginBottom: 'var(--space-xl)',
        boxShadow: isInProgress ? '0 0 20px rgba(59, 130, 246, 0.15)' : 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Banner: WHAT SHOULD I DO RIGHT NOW? */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: isInProgress ? 'var(--accent-text)' : isPaused ? 'var(--warning-text)' : 'var(--text-muted)',
            }}
          >
            <Sparkles size={14} />
            {isInProgress ? 'IN PROGRESS RIGHT NOW' : isPaused ? 'PAUSED SESSION' : 'WHAT SHOULD I DO RIGHT NOW?'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {task.startTime && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-input)',
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {task.startTime}
            </span>
          )}

          {(subject?.name || task.category) && (
            <Badge variant="blue" style={subject?.color ? { color: subject.color, borderColor: `${subject.color}50` } : undefined}>
              {subject?.name || task.category}
            </Badge>
          )}

          <Badge variant={task.priority === 'critical' ? 'red' : task.priority === 'high' ? 'amber' : 'neutral'}>
            {task.priority} priority
          </Badge>
        </div>
      </div>

      {/* Main Task Title and Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
            {task.title}
          </h2>
          {task.description && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
              {task.description}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={15} />
              Duration: {task.duration} min
            </span>
            {task.actualDuration ? (
              <span style={{ color: 'var(--accent-text)', fontWeight: 600 }}>
                Elapsed: {task.actualDuration}m
              </span>
            ) : null}
            {task.notes && (
              <span style={{ fontStyle: 'italic' }}>
                Note: {task.notes}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {isInProgress ? (
            <>
              <button
                className="btn btn-secondary"
                style={{ padding: '10px 16px', fontSize: '0.9rem' }}
                onClick={handlePause}
              >
                <Pause size={16} /> Pause
              </button>
              <button
                className="btn btn-primary"
                style={{ padding: '10px 20px', fontSize: '0.95rem' }}
                onClick={() => onComplete(task.id)}
              >
                <CheckCircle2 size={18} /> Complete Task
              </button>
            </>
          ) : isPaused ? (
            <>
              <button
                className="btn btn-primary"
                style={{ padding: '10px 20px', fontSize: '0.95rem' }}
                onClick={handleResume}
              >
                <Play size={18} /> Resume Focus
              </button>
              <button
                className="btn btn-secondary"
                style={{ padding: '10px 16px', fontSize: '0.9rem' }}
                onClick={() => onComplete(task.id)}
              >
                <CheckCircle2 size={16} /> Mark Done
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.95rem' }}
              onClick={handleStartFocus}
            >
              <Play size={18} /> Start Focus Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
