import React, { useState } from 'react';
import type { Task, Subject } from '../../types';
import { TaskCard } from './TaskCard';
import { EmptyState } from '../common/EmptyState';
import { CalendarCheck } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  subjects: Subject[];
  onComplete: (id: string) => Promise<unknown>;
  onStart: (id: string) => Promise<unknown>;
  onPause: (id: string) => Promise<unknown>;
  onResume: (id: string) => Promise<unknown>;
  onSkip: (id: string) => Promise<unknown>;
  onCancel: (id: string) => Promise<unknown>;
  onReschedule: (id: string, newDate: string, newStartTime?: string) => Promise<unknown>;
  onDuplicate: (id: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onOpenQuickAdd: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  subjects,
  onComplete,
  onStart,
  onPause,
  onResume,
  onSkip,
  onCancel,
  onReschedule,
  onDuplicate,
  onDelete,
  onOpenQuickAdd,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'paused' | 'completed'>('all');

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'pending') return task.status === 'pending';
    if (filter === 'in_progress') return task.status === 'in_progress';
    if (filter === 'paused') return task.status === 'paused';
    if (filter === 'completed') return task.status === 'completed';
    return true;
  });

  const countPending = tasks.filter(t => t.status === 'pending').length;
  const countInProgress = tasks.filter(t => t.status === 'in_progress').length;
  const countPaused = tasks.filter(t => t.status === 'paused').length;
  const countCompleted = tasks.filter(t => t.status === 'completed').length;

  return (
    <div style={{ marginBottom: 'var(--space-2xl)' }}>
      {/* Header and Filter Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Today's Tasks
          </h2>
          <span
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            ({tasks.length})
          </span>
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setFilter('all')}
            style={filter === 'all' ? { borderColor: 'var(--border-focus)' } : {}}
          >
            All ({tasks.length})
          </button>
          <button
            className={`btn btn-sm ${filter === 'pending' ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setFilter('pending')}
            style={filter === 'pending' ? { borderColor: 'var(--border-focus)' } : {}}
          >
            Pending ({countPending})
          </button>
          <button
            className={`btn btn-sm ${filter === 'in_progress' ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setFilter('in_progress')}
            style={filter === 'in_progress' ? { borderColor: 'var(--border-focus)' } : {}}
          >
            Active ({countInProgress})
          </button>
          {countPaused > 0 && (
            <button
              className={`btn btn-sm ${filter === 'paused' ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => setFilter('paused')}
              style={filter === 'paused' ? { borderColor: 'var(--border-focus)' } : {}}
            >
              Paused ({countPaused})
            </button>
          )}
          <button
            className={`btn btn-sm ${filter === 'completed' ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setFilter('completed')}
            style={filter === 'completed' ? { borderColor: 'var(--border-focus)' } : {}}
          >
            Done ({countCompleted})
          </button>
        </div>
      </div>

      {/* Task List or Empty State */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck size={24} />}
          title={filter === 'all' ? "No tasks scheduled for today" : `No ${filter.replace('_', ' ')} tasks`}
          description={
            filter === 'all'
              ? "Your schedule is clear for today. Add a task to structure your study and execution."
              : `There are currently no tasks in the ${filter.replace('_', ' ')} state.`
          }
          actionText="+ Quick Add Task"
          onAction={onOpenQuickAdd}
        />
      ) : (
        <div>
          {filteredTasks.map(task => {
            const subject = subjects.find(s => s.id === task.subjectId);
            return (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={onComplete}
                onStart={onStart}
                onPause={onPause}
                onResume={onResume}
                onSkip={onSkip}
                onCancel={onCancel}
                onReschedule={onReschedule}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                subjectName={subject?.name}
                subjectColor={subject?.color}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
