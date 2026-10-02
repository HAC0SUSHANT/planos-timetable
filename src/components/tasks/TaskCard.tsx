import React, { useState } from 'react';
import type { Task, TaskPriority } from '../../types';
import { Badge } from '../common/Badge';
import type { BadgeVariant } from '../common/Badge';
import { useTimer } from '../../context/TimerContext';
import { 
  Clock, 
  CheckCircle2, 
  Circle, 
  Play, 
  Pause,
  MoreVertical, 
  Calendar, 
  Trash2, 
  XCircle, 
  SkipForward,
  Copy,
  Repeat
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => Promise<unknown>;
  onStart: (id: string) => Promise<unknown>;
  onPause: (id: string) => Promise<unknown>;
  onResume: (id: string) => Promise<unknown>;
  onSkip: (id: string) => Promise<unknown>;
  onCancel: (id: string) => Promise<unknown>;
  onReschedule: (id: string, newDate: string, newStartTime?: string) => Promise<unknown>;
  onDuplicate: (id: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  subjectName?: string;
  subjectColor?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onStart,
  onPause,
  onResume,
  onSkip,
  onCancel,
  onReschedule,
  onDuplicate,
  onDelete,
  subjectName,
  subjectColor,
}) => {
  const { startTimer } = useTimer();
  const [showMenu, setShowMenu] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(task.date);
  const [rescheduleTime, setRescheduleTime] = useState(task.startTime || '');

  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';
  const isPaused = task.status === 'paused';
  const isCancelled = task.status === 'cancelled';
  const isSkipped = task.status === 'skipped';

  const getPriorityVariant = (priority: TaskPriority): BadgeVariant => {
    switch (priority) {
      case 'critical': return 'red';
      case 'high': return 'amber';
      case 'medium': return 'blue';
      case 'low': return 'neutral';
    }
  };

  const handleToggleComplete = async () => {
    if (isCompleted) {
      await onStart(task.id);
    } else {
      await onComplete(task.id);
    }
  };

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

  const handleSaveReschedule = async () => {
    await onReschedule(task.id, rescheduleDate, rescheduleTime || undefined);
    setIsRescheduling(false);
    setShowMenu(false);
  };

  return (
    <div
      className="card"
      style={{
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xs)',
        position: 'relative',
        opacity: isCompleted || isCancelled || isSkipped ? 0.72 : 1,
        borderLeft: isInProgress 
          ? '3px solid var(--accent-primary)' 
          : isPaused 
          ? '3px solid var(--warning)' 
          : undefined,
        backgroundColor: isInProgress 
          ? 'var(--bg-active)' 
          : isPaused 
          ? 'rgba(245, 158, 11, 0.05)' 
          : 'var(--bg-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
        {/* Left: Completion Checkbox + Title & Subject */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)', flex: 1, minWidth: 0 }}>
          <button
            onClick={handleToggleComplete}
            aria-label={isCompleted ? 'Mark pending' : 'Mark completed'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isCompleted ? 'var(--success)' : 'var(--text-muted)',
              display: 'flex',
              padding: '2px 0 0 0',
              marginTop: '1px',
              transition: 'color var(--transition-fast)',
            }}
          >
            {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flexWrap: 'wrap', marginBottom: '4px' }}>
              {/* Scheduled Time */}
              {task.startTime && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-elevated)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {task.startTime}
                </span>
              )}

              {/* Subject or Category */}
              {(subjectName || task.category) && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    color: subjectColor || 'var(--accent-text)',
                    backgroundColor: subjectColor ? `${subjectColor}1A` : 'var(--accent-subtle)',
                    border: `1px solid ${subjectColor ? `${subjectColor}40` : 'rgba(59,130,246,0.3)'}`,
                  }}
                >
                  {subjectName || task.category}
                </span>
              )}

              {/* Priority */}
              <Badge variant={getPriorityVariant(task.priority)}>
                {task.priority}
              </Badge>

              {/* Recurring Tag */}
              {task.isRecurring && (
                <Badge variant="emerald" icon={<Repeat size={10} />}>
                  {task.recurrence?.frequency || 'recurring'}
                </Badge>
              )}

              {/* Status Badge */}
              {isInProgress && <Badge variant="blue">in progress</Badge>}
              {isPaused && <Badge variant="amber">paused</Badge>}
              {isSkipped && <Badge variant="neutral">skipped</Badge>}
              {isCancelled && <Badge variant="red">cancelled</Badge>}
            </div>

            {/* Task Title */}
            <h4
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                textDecoration: isCompleted ? 'line-through' : 'none',
                marginBottom: '2px',
                wordBreak: 'break-word',
              }}
            >
              {task.title}
            </h4>

            {/* Description */}
            {task.description && (
              <p
                style={{
                  fontSize: '0.825rem',
                  color: 'var(--text-secondary)',
                  marginTop: '4px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {task.description}
              </p>
            )}

            {/* Duration Meta */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
                marginTop: '6px',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} />
                {task.actualDuration ? (
                  <span>
                    Actual: <strong style={{ color: 'var(--text-primary)' }}>{task.actualDuration}m</strong> / Planned: {task.duration}m
                  </span>
                ) : (
                  <span>{task.duration} min</span>
                )}
              </span>

              {task.notes && (
                <span style={{ fontStyle: 'italic', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Note: {task.notes}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', position: 'relative' }}>
          {/* Start / Pause / Resume Controls */}
          {!isCompleted && !isCancelled && !isSkipped && (
            <>
              {isInProgress ? (
                <>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => onPause(task.id)}
                    title="Pause task"
                  >
                    <Pause size={13} /> Pause
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => onComplete(task.id)}
                    title="Complete task"
                  >
                    <CheckCircle2 size={13} /> Done
                  </button>
                </>
              ) : isPaused ? (
                <>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => onResume(task.id)}
                    title="Resume task"
                  >
                    <Play size={13} /> Resume
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => onComplete(task.id)}
                    title="Complete task"
                  >
                    <CheckCircle2 size={13} /> Done
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={handleStartFocus}
                  title="Start focus timer for this task"
                >
                  <Play size={13} /> Start
                </button>
              )}
            </>
          )}

          {/* More options menu */}
          <button
            className="btn-icon"
            onClick={() => setShowMenu(!showMenu)}
            aria-label="More options"
          >
            <MoreVertical size={16} />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-md)',
                zIndex: 50,
                minWidth: '160px',
                padding: '4px',
              }}
            >
              <button
                className="btn-outline btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '6px 10px' }}
                onClick={() => {
                  setIsRescheduling(true);
                  setShowMenu(false);
                }}
              >
                <Calendar size={14} style={{ marginRight: '6px' }} /> Reschedule
              </button>

              <button
                className="btn-outline btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '6px 10px' }}
                onClick={() => {
                  onDuplicate(task.id);
                  setShowMenu(false);
                }}
              >
                <Copy size={14} style={{ marginRight: '6px' }} /> Duplicate
              </button>

              <button
                className="btn-outline btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '6px 10px' }}
                onClick={() => {
                  onSkip(task.id);
                  setShowMenu(false);
                }}
              >
                <SkipForward size={14} style={{ marginRight: '6px' }} /> Mark Skipped
              </button>

              <button
                className="btn-outline btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '6px 10px' }}
                onClick={() => {
                  onCancel(task.id);
                  setShowMenu(false);
                }}
              >
                <XCircle size={14} style={{ marginRight: '6px' }} /> Cancel
              </button>

              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

              <button
                className="btn-outline btn-sm"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  border: 'none',
                  padding: '6px 10px',
                  color: 'var(--danger-text)',
                }}
                onClick={() => {
                  onDelete(task.id);
                  setShowMenu(false);
                }}
              >
                <Trash2 size={14} style={{ marginRight: '6px' }} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Inline Form */}
      {isRescheduling && (
        <div
          style={{
            marginTop: 'var(--space-sm)',
            padding: 'var(--space-sm)',
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Date:</label>
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
              value={rescheduleDate}
              onChange={e => setRescheduleDate(e.target.value)}
            />
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Time:</label>
            <input
              type="time"
              className="form-input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
              value={rescheduleTime}
              onChange={e => setRescheduleTime(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" onClick={handleSaveReschedule}>
              Save
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setIsRescheduling(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
