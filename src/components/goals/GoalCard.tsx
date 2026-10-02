import React from 'react';
import type { Goal, GoalStatus } from '../../types';
import { ProgressBar } from '../common/ProgressBar';
import { Badge } from '../common/Badge';
import type { BadgeVariant } from '../common/Badge';
import { Calendar, Edit3, Trash2, CheckCircle2, Circle, Sparkles } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => Promise<unknown>;
  onToggleMilestone?: (goalId: string, milestoneId: string) => void;
  onDecompose?: (goal: Goal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onDelete,
  onToggleMilestone,
  onDecompose,
}) => {
  const getStatusBadge = (status: GoalStatus): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case 'active':
        return { label: 'Active', variant: 'emerald' };
      case 'completed':
        return { label: 'Completed', variant: 'blue' };
      case 'paused':
        return { label: 'Paused', variant: 'amber' };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'neutral' };
      default:
        return { label: 'Active', variant: 'emerald' };
    }
  };

  const statusInfo = getStatusBadge(goal.status);

  const formatDeadline = (dateStr?: string) => {
    if (!dateStr) return 'No deadline';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const completedMilestones = (goal.milestones || []).filter(m => m.completed).length;
  const totalMilestones = (goal.milestones || []).length;

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        gap: 'var(--space-md)',
      }}
    >
      <div>
        {/* Header: Category, Status & Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-sm)',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {goal.category && <Badge variant="neutral">{goal.category}</Badge>}
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {onDecompose && (
              <button
                className="btn-icon"
                onClick={() => onDecompose(goal)}
                aria-label="AI decompose goal"
                title="AI Decompose Goal into Milestones & Tasks"
                style={{ color: 'var(--accent-text)' }}
              >
                <Sparkles size={15} />
              </button>
            )}
            <button
              className="btn-icon"
              onClick={() => onEdit(goal)}
              aria-label="Edit goal"
              title="Edit goal"
            >
              <Edit3 size={15} />
            </button>
            <button
              className="btn-icon"
              onClick={() => onDelete(goal.id)}
              aria-label="Delete goal"
              title="Delete goal"
              style={{ color: 'var(--danger-text)' }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Goal Name */}
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
          {goal.name}
        </h3>

        {/* Description */}
        {goal.description && (
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-sm)',
              lineHeight: 1.45,
            }}
          >
            {goal.description}
          </p>
        )}

        {/* Milestones Checklist */}
        {goal.milestones && goal.milestones.length > 0 && (
          <div
            style={{
              marginTop: 'var(--space-sm)',
              padding: '8px 10px',
              backgroundColor: 'var(--bg-input)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                marginBottom: '6px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Milestones</span>
              <span>{completedMilestones}/{totalMilestones}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {goal.milestones.map(m => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    fontSize: '0.8rem',
                  }}
                >
                  <button
                    onClick={() => onToggleMilestone && onToggleMilestone(goal.id, m.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      textAlign: 'left',
                      color: m.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: m.completed ? 'line-through' : 'none',
                    }}
                  >
                    {m.completed ? (
                      <CheckCircle2 size={14} color="var(--success-text)" />
                    ) : (
                      <Circle size={14} color="var(--text-muted)" />
                    )}
                    <span>{m.title}</span>
                  </button>

                  {m.totalTasks ? (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {m.completedTasks || 0}/{m.totalTasks} tasks
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress & Target Section */}
      <div style={{ marginTop: 'auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8125rem',
            marginBottom: '6px',
          }}
        >
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Overall Goal Progress</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {goal.progress}%
          </span>
        </div>
        <ProgressBar value={goal.progress} height={7} />

        {/* Dates Meta */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'var(--space-sm)',
            paddingTop: 'var(--space-xs)',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} />
            <span>Target: {formatDeadline(goal.targetDate)}</span>
          </div>

          {onDecompose && (!goal.milestones || goal.milestones.length === 0) && (
            <button
              className="btn btn-outline btn-sm"
              style={{ padding: '2px 8px', fontSize: '0.72rem', border: 'none', color: 'var(--accent-text)' }}
              onClick={() => onDecompose(goal)}
            >
              <Sparkles size={12} style={{ marginRight: '3px' }} /> AI Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
