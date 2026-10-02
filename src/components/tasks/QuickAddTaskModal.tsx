import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import type { CreateTaskDTO, TaskPriority, Subject, Goal, RecurrenceFrequency, RecurrenceEndCondition } from '../../types';
import { getTodayDateString } from '../../data/initialData';
import { Repeat } from 'lucide-react';

interface QuickAddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateTaskDTO) => Promise<unknown>;
  subjects: Subject[];
  goals: Goal[];
}

export const QuickAddTaskModal: React.FC<QuickAddTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  subjects,
  goals,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState('45');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [notes, setNotes] = useState('');

  // Recurrence states
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('daily');
  const [endCondition, setEndCondition] = useState<RecurrenceEndCondition>('forever');
  const [endDate, setEndDate] = useState('');
  const [maxOccurrences, setMaxOccurrences] = useState('10');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeGoal = goals.find(g => g.id === selectedGoalId);

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    if (val && endTime) {
      calculateDuration(val, endTime);
    }
  };

  const handleEndTimeChange = (val: string) => {
    setEndTime(val);
    if (startTime && val) {
      calculateDuration(startTime, val);
    }
  };

  const calculateDuration = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff > 0) {
      setDuration(String(diff));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const subject = subjects.find(s => s.id === selectedSubjectId);

      const dto: CreateTaskDTO = {
        title: title.trim(),
        description: description.trim() || undefined,
        date: date || getTodayDateString(),
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        duration: parseInt(duration, 10) || 30,
        priority: priority,
        subjectId: selectedSubjectId || undefined,
        category: subject ? subject.name : undefined,
        goalId: selectedGoalId || undefined,
        milestoneId: selectedMilestoneId || undefined,
        notes: notes.trim() || undefined,
        isRecurring,
        recurrence: isRecurring ? {
          frequency,
          endCondition,
          endDate: endCondition === 'until_date' ? endDate : undefined,
          maxOccurrences: endCondition === 'count' ? parseInt(maxOccurrences, 10) : undefined,
          occurrenceCount: 1,
        } : undefined,
      };

      await onSubmit(dto);

      // Reset
      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setDuration('45');
      setPriority('medium');
      setSelectedSubjectId('');
      setSelectedGoalId('');
      setSelectedMilestoneId('');
      setNotes('');
      setIsRecurring(false);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Scheduled Task"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting ? 'Creating...' : 'Schedule Task'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--danger-subtle)',
              color: 'var(--danger-text)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginBottom: 'var(--space-md)',
            }}
          >
            {error}
          </div>
        )}

        {/* Task Name */}
        <div className="form-group">
          <label className="form-label">Task Title *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Physics Electrostatics PYQs"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Description (Optional)</label>
          <textarea
            className="form-textarea"
            style={{ minHeight: '55px' }}
            placeholder="Key concepts, question numbers, or specific focus area..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Date and Priority */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Priority</label>
            <select
              className="form-select"
              value={priority}
              onChange={e => setPriority(e.target.value as TaskPriority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Time and Duration */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Start Time</label>
            <input
              type="time"
              className="form-input"
              value={startTime}
              onChange={e => handleStartTimeChange(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">End Time (or duration)</label>
            <input
              type="time"
              className="form-input"
              value={endTime}
              onChange={e => handleEndTimeChange(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Duration (minutes)</label>
          <input
            type="number"
            className="form-input"
            min="5"
            step="5"
            value={duration}
            onChange={e => setDuration(e.target.value)}
          />
        </div>

        {/* Recurrence Toggle & Options (Section 4 Requirement) */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 'var(--space-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
              <Repeat size={16} color="var(--accent-text)" />
              Repeat / Recurring Task
            </label>
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={e => setIsRecurring(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
          </div>

          {isRecurring && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Recurrence Frequency</label>
                  <select
                    className="form-select"
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as RecurrenceFrequency)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays (Mon-Fri)</option>
                    <option value="weekly">Weekly</option>
                    <option value="interval">Every 2 Days</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">End Condition</label>
                  <select
                    className="form-select"
                    value={endCondition}
                    onChange={e => setEndCondition(e.target.value as RecurrenceEndCondition)}
                  >
                    <option value="forever">Forever</option>
                    <option value="until_date">Until a date</option>
                    <option value="count">Fixed number of times</option>
                  </select>
                </div>
              </div>

              {endCondition === 'until_date' && (
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              )}

              {endCondition === 'count' && (
                <div className="form-group">
                  <label className="form-label">Max Occurrences</label>
                  <input
                    type="number"
                    className="form-input"
                    value={maxOccurrences}
                    onChange={e => setMaxOccurrences(e.target.value)}
                    min="1"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Subject and Goal */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Subject / Category</label>
            <select
              className="form-select"
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
            >
              <option value="">-- No Subject --</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Connected Goal</label>
            <select
              className="form-select"
              value={selectedGoalId}
              onChange={e => {
                setSelectedGoalId(e.target.value);
                setSelectedMilestoneId('');
              }}
            >
              <option value="">-- No Goal --</option>
              {goals.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Milestone Selector if Goal is selected */}
        {activeGoal && activeGoal.milestones && activeGoal.milestones.length > 0 && (
          <div className="form-group">
            <label className="form-label">Linked Milestone</label>
            <select
              className="form-select"
              value={selectedMilestoneId}
              onChange={e => setSelectedMilestoneId(e.target.value)}
            >
              <option value="">-- No Milestone --</option>
              {activeGoal.milestones.map(m => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notes */}
        <div className="form-group">
          <label className="form-label">Execution Notes</label>
          <input
            type="text"
            className="form-input"
            placeholder="Any reminders or resources..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};
