import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Task } from '../types';
import {
  Plus,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Calendar,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { SchedulingEngineService } from '../services/schedulingEngine.service';

type CalendarMode = 'day' | 'week' | 'month';

export const ScheduleView: React.FC = () => {
  const {
    tasks,
    subjects,
    settings,
    setIsQuickAddOpen,
    completeTask,
    updateTask,
    rescheduleTask,
    refreshData,
  } = useApp();

  const [calendarMode, setCalendarMode] = useState<CalendarMode>('day');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Filter tasks for selected date
  const selectedDateTasks = tasks.filter(t => t.date === selectedDate);
  const displayTasks = [...selectedDateTasks].sort((a, b) =>
    (a.startTime || '99:99').localeCompare(b.startTime || '99:99')
  );

  // Conflict detection & Workload audit
  const conflicts = SchedulingEngineService.detectConflicts(selectedDateTasks);
  const workloadAudit = SchedulingEngineService.auditWorkload(
    selectedDateTasks,
    settings,
    selectedDate
  );

  // Group tasks by period
  const morningTasks = displayTasks.filter(t => t.startTime && t.startTime < '12:00');
  const afternoonTasks = displayTasks.filter(
    t => t.startTime && t.startTime >= '12:00' && t.startTime < '17:00'
  );
  const eveningTasks = displayTasks.filter(t => !t.startTime || t.startTime >= '17:00');

  // Navigate date
  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleApplyWorkloadBalance = async () => {
    if (!workloadAudit.recommendedPostponedTasks.length) return;
    const tomorrow = new Date(selectedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    for (const t of workloadAudit.recommendedPostponedTasks) {
      await rescheduleTask(t.id, tomorrowStr, t.startTime);
    }
    await refreshData();
  };

  // Quick duration change
  const handleDurationChange = async (taskId: string, currentDur: number, delta: number) => {
    const newDur = Math.max(15, currentDur + delta);
    await updateTask(taskId, { duration: newDur });
  };

  // Week View dates helper
  const getWeekDates = (baseDateStr: string) => {
    const base = new Date(baseDateStr);
    const day = base.getDay();
    const diff = base.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(base.setDate(diff));
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const nextD = new Date(monday);
      nextD.setDate(monday.getDate() + i);
      dates.push(nextD.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedDate);

  // Month View dates helper (first day to last day of month)
  const getMonthDays = (baseDateStr: string) => {
    const [y, m] = baseDateStr.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const days: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push(dayStr);
    }
    return days;
  };

  const monthDays = getMonthDays(selectedDate);

  const renderTaskCard = (task: Task) => {
    const subject = subjects.find(s => s.id === task.subjectId);
    const isDone = task.status === 'completed';
    const isConflicting = conflicts.some(
      c => c.taskA.id === task.id || c.taskB.id === task.id
    );

    return (
      <div
        key={task.id}
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-sm) var(--space-md)',
          opacity: isDone ? 0.7 : 1,
          gap: 'var(--space-md)',
          borderLeft: isConflicting ? '3px solid var(--danger)' : isDone ? '3px solid var(--success)' : '3px solid transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', minWidth: 0, flex: 1 }}>
          <button
            onClick={() => (isDone ? updateTask(task.id, { status: 'pending' }) : completeTask(task.id))}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isDone ? 'var(--success)' : 'var(--text-muted)',
            }}
          >
            {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
          </button>

          <div style={{ minWidth: '70px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600 }}>
            {task.startTime || '--:--'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textDecoration: isDone ? 'line-through' : 'none',
                  color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                }}
              >
                {task.title}
              </span>
              {subject && (
                <span style={{ fontSize: '0.75rem', color: subject.color, fontWeight: 600 }}>
                  • {subject.name}
                </span>
              )}
              {isConflicting && (
                <Badge variant="red">
                  <AlertTriangle size={10} style={{ marginRight: '3px' }} /> Conflict
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Duration Adjuster & Priority */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: 'var(--bg-input)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
            <button
              onClick={() => handleDurationChange(task.id, task.duration, -15)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}
              title="Decrease duration by 15m"
            >
              -
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 600 }}>
              {task.duration}m
            </span>
            <button
              onClick={() => handleDurationChange(task.id, task.duration, 15)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}
              title="Increase duration by 15m"
            >
              +
            </button>
          </div>

          <Badge variant={task.priority === 'critical' ? 'red' : task.priority === 'high' ? 'amber' : 'neutral'}>
            {task.priority}
          </Badge>

          <button
            className="btn-icon"
            style={{ padding: '2px 6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}
            onClick={() => {
              const nextD = new Date(task.date);
              nextD.setDate(nextD.getDate() + 1);
              rescheduleTask(task.id, nextD.toISOString().split('T')[0], task.startTime);
            }}
            title="Move to tomorrow"
          >
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    );
  };

  const renderSection = (title: string, sectionTasks: Task[]) => (
    <div style={{ marginBottom: 'var(--space-lg)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 'var(--space-xs)',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 'var(--space-sm)',
        }}
      >
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title} ({sectionTasks.length})
        </h3>
      </div>

      {sectionTasks.length === 0 ? (
        <div style={{ padding: 'var(--space-sm)', color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
          No tasks scheduled for this block.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          {sectionTasks.map(renderTaskCard)}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Top Header & Navigation */}
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
            Schedule & Time Blocks
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Realistic calendar engine with conflict detection and workload overflow balancing.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            <button
              className={`btn btn-sm ${calendarMode === 'day' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', padding: '4px 10px', fontSize: '0.78rem' }}
              onClick={() => setCalendarMode('day')}
            >
              <Calendar size={13} /> Day
            </button>
            <button
              className={`btn btn-sm ${calendarMode === 'week' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', padding: '4px 10px', fontSize: '0.78rem' }}
              onClick={() => setCalendarMode('week')}
            >
              <CalendarDays size={13} /> Week
            </button>
            <button
              className={`btn btn-sm ${calendarMode === 'month' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', padding: '4px 10px', fontSize: '0.78rem' }}
              onClick={() => setCalendarMode('month')}
            >
              <CalendarRange size={13} /> Month
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => setIsQuickAddOpen(true)}>
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div
        className="card"
        style={{
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn-icon" onClick={() => changeDate(-1)} title="Previous day">
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <button className="btn-icon" onClick={() => changeDate(1)} title="Next day">
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          >
            Today
          </button>
        </div>
      </div>

      {/* Conflict Warning Alert */}
      {conflicts.length > 0 && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--danger-subtle)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <AlertTriangle size={18} color="var(--danger-text)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--danger-text)' }}>
              Schedule Conflict Detected ({conflicts.length})
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginTop: '2px' }}>
              {conflicts.map((c, i) => (
                <div key={i}>
                  "{c.taskA.title}" ({c.taskA.startTime}) overlaps with "{c.taskB.title}" ({c.taskB.startTime}) by {c.overlapMinutes} mins.
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Realistic Workload Overflow Warning */}
      {workloadAudit.isOverloaded && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--warning-subtle)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} color="var(--warning-text)" />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--warning-text)' }}>
                Workload Overflow Warning
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                {workloadAudit.adviceMessage}
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleApplyWorkloadBalance}
          >
            Balance Plan (Move to Tomorrow)
          </button>
        </div>
      )}

      {/* DAY VIEW */}
      {calendarMode === 'day' && (
        <div>
          {renderSection('Morning Focus (06:00 - 12:00)', morningTasks)}
          {renderSection('Afternoon Deep Work (12:00 - 17:00)', afternoonTasks)}
          {renderSection('Evening & Review (17:00 - 23:00)', eveningTasks)}
        </div>
      )}

      {/* WEEK VIEW */}
      {calendarMode === 'week' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
          }}
        >
          {weekDates.map(dateStr => {
            const dayTasks = tasks.filter(t => t.date === dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;
            const d = new Date(dateStr + 'T00:00:00');

            return (
              <div
                key={dateStr}
                className="card"
                style={{
                  padding: '10px 8px',
                  cursor: 'pointer',
                  border: isSelected
                    ? '2px solid var(--accent-primary)'
                    : isToday
                    ? '1px solid var(--accent-text)'
                    : '1px solid var(--border-subtle)',
                  minHeight: '260px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onClick={() => {
                  setSelectedDate(dateStr);
                  setCalendarMode('day');
                }}
              >
                <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {d.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: isToday ? 'var(--accent-text)' : 'var(--text-primary)' }}>
                    {d.getDate()}
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                  {dayTasks.map(t => (
                    <div
                      key={t.id}
                      style={{
                        padding: '3px 6px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: t.status === 'completed' ? 'var(--bg-elevated)' : 'var(--accent-subtle)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: t.status === 'completed' ? 'var(--text-muted)' : 'var(--accent-text)',
                        textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={`${t.startTime || ''} ${t.title}`}
                    >
                      {t.startTime ? `${t.startTime} ` : ''}{t.title}
                    </div>
                  ))}
                  {dayTasks.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '12px' }}>
                      Free day
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MONTH VIEW */}
      {calendarMode === 'month' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '6px',
          }}
        >
          {monthDays.map(dateStr => {
            const dayTasks = tasks.filter(t => t.date === dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;
            const d = new Date(dateStr + 'T00:00:00');

            return (
              <div
                key={dateStr}
                className="card"
                style={{
                  padding: '8px',
                  cursor: 'pointer',
                  minHeight: '75px',
                  border: isSelected
                    ? '2px solid var(--accent-primary)'
                    : isToday
                    ? '1px solid var(--accent-text)'
                    : '1px solid var(--border-subtle)',
                }}
                onClick={() => {
                  setSelectedDate(dateStr);
                  setCalendarMode('day');
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: isToday ? 800 : 500, color: isToday ? 'var(--accent-text)' : 'var(--text-primary)' }}>
                    {d.getDate()}
                  </span>
                  {dayTasks.length > 0 && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--accent-subtle)',
                        color: 'var(--accent-text)',
                      }}
                    >
                      {dayTasks.length}
                    </span>
                  )}
                </div>
                <div style={{ marginTop: '4px', fontSize: '0.68rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {dayTasks[0]?.title}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
