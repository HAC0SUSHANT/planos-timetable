import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import type { Goal, CreateGoalDTO, UpdateGoalDTO, GoalStatus, Subject } from '../../types';
import { getTodayDateString } from '../../data/initialData';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateGoalDTO | UpdateGoalDTO, goalId?: string) => Promise<unknown>;
  goalToEdit?: Goal | null;
  subjects: Subject[];
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  goalToEdit,
  subjects,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [targetDate, setTargetDate] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<GoalStatus>('active');
  const [category, setCategory] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (goalToEdit) {
      setName(goalToEdit.name);
      setDescription(goalToEdit.description);
      setStartDate(goalToEdit.startDate);
      setTargetDate(goalToEdit.targetDate);
      setProgress(goalToEdit.progress);
      setStatus(goalToEdit.status);
      setCategory(goalToEdit.category || '');
      setSubjectId(goalToEdit.subjectId || '');
    } else {
      setName('');
      setDescription('');
      setStartDate(getTodayDateString());
      setTargetDate('');
      setProgress(0);
      setStatus('active');
      setCategory('');
      setSubjectId('');
    }
  }, [goalToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Goal name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        name: name.trim(),
        description: description.trim(),
        startDate,
        targetDate,
        progress: Number(progress),
        status,
        category: category.trim() || undefined,
        subjectId: subjectId || undefined,
      };

      await onSubmit(payload, goalToEdit?.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={goalToEdit ? 'Edit Goal' : 'Create New Goal'}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? 'Saving...' : goalToEdit ? 'Save Changes' : 'Create Goal'}
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

        <div className="form-group">
          <label className="form-label">Goal Name *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Master Python Backend & Distributed Systems"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            placeholder="Why is this goal important? What is the outcome?"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target / Deadline *</label>
            <input
              type="date"
              className="form-input"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={status}
              onChange={e => setStatus(e.target.value as GoalStatus)}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Progress ({progress}%)</label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={e => setProgress(Number(e.target.value))}
              style={{ width: '100%', marginTop: '8px' }}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Connected Subject</label>
            <select
              className="form-select"
              value={subjectId}
              onChange={e => {
                setSubjectId(e.target.value);
                const s = subjects.find(sub => sub.id === e.target.value);
                if (s) setCategory(s.name);
              }}
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
            <label className="form-label">Category</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Engineering, Exams, Career"
              value={category}
              onChange={e => setCategory(e.target.value)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
