import React from 'react';
import { useApp } from '../../context/AppContext';
import { useTimer } from '../../context/TimerContext';
import { Bell, Play, Clock, Check } from 'lucide-react';

export const ReminderNotificationBanner: React.FC = () => {
  const { reminders, dismissReminder, snoozeReminder, tasks, startTask } = useApp();
  const { startTimer } = useTimer();

  // Find first active due reminder
  const nowISO = new Date().toISOString();
  const dueReminders = reminders.filter(r => {
    if (r.isDismissed) return false;
    const trigger = r.snoozeUntil || r.triggerAt;
    return trigger <= nowISO;
  });

  if (dueReminders.length === 0) return null;

  const current = dueReminders[0];
  const linkedTask = current.taskId ? tasks.find(t => t.id === current.taskId) : null;

  const handleStart = async () => {
    if (linkedTask) {
      await startTask(linkedTask.id);
      startTimer({
        mode: 'countdown',
        durationMinutes: linkedTask.duration || 45,
        taskId: linkedTask.id,
        subjectId: linkedTask.subjectId,
        taskTitle: linkedTask.title,
      });
    }
    await dismissReminder(current.id);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-md)',
        padding: '12px 18px',
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        border: '1px solid var(--accent-primary)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-lg)',
        boxShadow: 'var(--shadow-sm)',
        animation: 'fadeIn 200ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <Bell size={16} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            {current.title}
          </div>
          {current.message && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {current.message}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {linkedTask && (
          <button className="btn btn-primary btn-sm" onClick={handleStart}>
            <Play size={13} /> Start Task
          </button>
        )}

        <button className="btn btn-outline btn-sm" onClick={() => snoozeReminder(current.id, 5)}>
          <Clock size={13} /> Snooze 5m
        </button>

        <button className="btn btn-outline btn-sm" onClick={() => snoozeReminder(current.id, 15)}>
          15m
        </button>

        <button className="btn-icon" onClick={() => dismissReminder(current.id)} title="Dismiss">
          <Check size={16} />
        </button>
      </div>
    </div>
  );
};
