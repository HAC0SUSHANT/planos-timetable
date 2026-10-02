import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { getTodayDateString } from '../../data/initialData';
import { Star, Save, Check } from 'lucide-react';

interface DailyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyReviewModal: React.FC<DailyReviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { tasks, habits, studySessions, saveReview } = useApp();
  const today = getTodayDateString();

  const todayTasks = tasks.filter(t => t.date === today);
  const completedTasks = todayTasks.filter(t => t.status === 'completed');
  const missedTasks = todayTasks.filter(t => t.status === 'pending' || t.status === 'paused' || t.status === 'skipped');

  const plannedMins = todayTasks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const actualMins = todayTasks.reduce((acc, t) => acc + (t.actualDuration || (t.status === 'completed' ? t.duration : 0)), 0);

  const completedHabits = habits.filter(h => h.completionHistory.includes(today));
  const todayStudyMins = studySessions
    .filter(s => s.date === today)
    .reduce((acc, s) => acc + (s.actualDuration || 0), 0);

  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatToChangeTomorrow, setWhatToChangeTomorrow] = useState('');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveReview({
        date: today,
        plannedMinutes: plannedMins,
        actualMinutes: actualMins,
        tasksCompleted: completedTasks.length,
        tasksMissed: missedTasks.length,
        tasksRescheduled: 0,
        habitsCompleted: completedHabits.length,
        studyMinutes: todayStudyMins,
        whatWentWell: whatWentWell.trim() || 'Consistent execution on core tasks.',
        whatToChangeTomorrow: whatToChangeTomorrow.trim() || 'Start morning deep work 15 minutes earlier.',
        rating,
      });

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to save review:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Daily Review & Audit (${today})`}
      maxWidth="640px"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={isSaving}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving || savedSuccess}>
            {savedSuccess ? (
              <>
                <Check size={16} /> Saved!
              </>
            ) : isSaving ? (
              'Saving...'
            ) : (
              <>
                <Save size={16} /> Complete & Save Review
              </>
            )}
          </button>
        </>
      }
    >
      <div>
        {/* Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-lg)',
          }}
        >
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Planned Time</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {Math.round(plannedMins / 60)}h {plannedMins % 60}m
            </div>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Actual Time</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-text)', marginTop: '2px' }}>
              {Math.round(actualMins / 60)}h {actualMins % 60}m
            </div>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tasks Done</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--success-text)', marginTop: '2px' }}>
              {completedTasks.length} / {todayTasks.length}
            </div>
          </div>
        </div>

        {/* Reflection Prompts */}
        <div className="form-group">
          <label className="form-label">What went well today?</label>
          <textarea
            className="form-textarea"
            placeholder="e.g. Focused deeply on Electrostatics without phone distraction; completed 20 problems..."
            value={whatWentWell}
            onChange={e => setWhatWentWell(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">What should change tomorrow?</label>
          <textarea
            className="form-textarea"
            placeholder="e.g. Schedule 15 more minutes for difficult integrals; take a 5-minute walk before evening block..."
            value={whatToChangeTomorrow}
            onChange={e => setWhatToChangeTomorrow(e.target.value)}
          />
        </div>

        {/* 5-Star Rating */}
        <div className="form-group">
          <label className="form-label">Day Rating</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star as any)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: star <= rating ? '#F59E0B' : 'var(--text-muted)',
                }}
              >
                <Star size={24} fill={star <= rating ? '#F59E0B' : 'none'} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
