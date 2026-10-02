import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { HabitFrequency } from '../types';
import { Flame, CheckCircle2, Circle, Plus, Trash2, Target, Clock } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';

export const HabitsView: React.FC = () => {
  const { habits, goals, createHabit, toggleHabitDate, deleteHabit } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [preferredTime, setPreferredTime] = useState('08:00');
  const [selectedGoalId, setSelectedGoalId] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createHabit({
      name: name.trim(),
      description: description.trim() || undefined,
      frequency,
      preferredTime: preferredTime || undefined,
      goalId: selectedGoalId || undefined,
    });

    setName('');
    setDescription('');
    setSelectedGoalId('');
    setIsModalOpen(false);
  };

  // Generate last 14 days for history dot-matrix
  const getLastNDays = (n: number) => {
    const dates: string[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const last14Days = getLastNDays(14);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-md)',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 2px 0' }}>
            Habits & Daily Consistency
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Track streaks, 30-day consistency rates, and historical compliance.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Add Habit
        </button>
      </div>

      {/* Habits List or Empty State */}
      {habits.length === 0 ? (
        <EmptyState
          icon={<Flame size={28} />}
          title="No habits tracked yet"
          description="Formulate daily habits that systematically compound into mastery."
          actionText="Create your first habit"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {habits.map(habit => {
            const isDoneToday = (habit.completionHistory || []).includes(todayStr);
            const goal = goals.find(g => g.id === habit.goalId);

            // Compute last 28 days completion stats
            const totalRecorded = (habit.completionHistory || []).length;
            const completedCount = totalRecorded;

            return (
              <div
                key={habit.id}
                className="card"
                style={{
                  padding: 'var(--space-md) var(--space-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-md)',
                  backgroundColor: isDoneToday ? 'var(--bg-active)' : 'var(--bg-card)',
                  borderLeft: isDoneToday ? '4px solid var(--success-text)' : '4px solid var(--border-subtle)',
                }}
              >
                {/* Header Row: Checkbox, Name, Streak Badge, Delete */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', minWidth: 0, flex: 1 }}>
                    <button
                      onClick={() => toggleHabitDate(habit.id, todayStr)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: isDoneToday ? 'var(--success-text)' : 'var(--text-muted)',
                        padding: 0,
                      }}
                      title={isDoneToday ? 'Mark as incomplete today' : 'Mark as complete today'}
                    >
                      {isDoneToday ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 600,
                            margin: 0,
                            color: isDoneToday ? 'var(--text-secondary)' : 'var(--text-primary)',
                            textDecoration: isDoneToday ? 'line-through' : 'none',
                          }}
                        >
                          {habit.name}
                        </h4>
                        {goal && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--accent-subtle)',
                              color: 'var(--accent-text)',
                              fontWeight: 600,
                            }}
                          >
                            <Target size={10} style={{ display: 'inline', marginRight: '3px' }} />
                            {goal.name}
                          </span>
                        )}
                      </div>

                      {habit.description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                          {habit.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'var(--bg-elevated)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <Flame size={15} color={(habit.streak ?? habit.currentStreak ?? 0) > 0 ? '#F97316' : 'var(--text-muted)'} />
                      <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {habit.streak ?? habit.currentStreak ?? 0} {(habit.streak ?? habit.currentStreak ?? 0) === 1 ? 'day' : 'days'}
                      </span>
                    </div>

                    <button
                      className="btn-icon"
                      onClick={() => deleteHabit(habit.id)}
                      style={{ color: 'var(--danger-text)' }}
                      title="Delete habit"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Metrics Breakdown Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: 'var(--space-sm)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span>
                      <strong>Frequency:</strong> {habit.frequency}
                    </span>
                    {habit.preferredTime && (
                      <span>
                        <Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />
                        {habit.preferredTime}
                      </span>
                    )}
                    <span>
                      <strong>Best streak:</strong> {habit.bestStreak || (habit.streak ?? habit.currentStreak ?? 0)} days
                    </span>
                    <span>
                      <strong>Consistency:</strong> {habit.consistencyRate || 0}% ({completedCount}/{totalRecorded || 28} days)
                    </span>
                  </div>

                  {/* 14-Day Visual Heatmap Matrix */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '3px' }}>
                      14-day history:
                    </span>
                    {last14Days.map(dStr => {
                      const isCompletedOnDay = (habit.completionHistory || []).includes(dStr);
                      const isCurrentDay = dStr === todayStr;
                      return (
                        <button
                          key={dStr}
                          onClick={() => toggleHabitDate(habit.id, dStr)}
                          title={`${dStr}: ${isCompletedOnDay ? 'Completed (Click to toggle)' : 'Missed (Click to backfill)'}`}
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '3px',
                            backgroundColor: isCompletedOnDay
                              ? 'var(--success-text)'
                              : 'var(--border-default)',
                            border: isCurrentDay ? '1px solid var(--accent-primary)' : 'none',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Habit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Habit"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreate}>
              Save Habit
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Habit Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Daily PYQs Drill, 30m Workout, Reading..."
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Execution Standard</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Solve at least 15 electrostatics questions before dinner."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Frequency</label>
              <select
                className="form-select"
                value={frequency}
                onChange={e => setFrequency(e.target.value as HabitFrequency)}
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays (Mon-Fri)</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Time</label>
              <input
                type="time"
                className="form-input"
                value={preferredTime}
                onChange={e => setPreferredTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Link to Goal (Optional)</label>
            <select
              className="form-select"
              value={selectedGoalId}
              onChange={e => setSelectedGoalId(e.target.value)}
            >
              <option value="">-- No Goal Associated --</option>
              {goals.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};
