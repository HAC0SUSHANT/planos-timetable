import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NextTaskCard } from '../components/tasks/NextTaskCard';
import { TaskList } from '../components/tasks/TaskList';
import { GoalCard } from '../components/goals/GoalCard';
import { NLPQuickAdd } from '../components/tasks/NLPQuickAdd';
import { DailyReviewModal } from '../components/reviews/DailyReviewModal';
import {
  Clock,
  CheckCircle2,
  Sparkles,
  Bell,
  RotateCcw,
  Flame,
  Award,
  Target,
  ArrowRight,
} from 'lucide-react';
import { AdaptiveSchedulerService } from '../services/adaptiveScheduler.service';

export const TodayView: React.FC = () => {
  const {
    tasks,
    goals,
    subjects,
    habits,
    reminders,
    progress,
    nextTask,
    completeTask,
    startTask,
    pauseTask,
    resumeTask,
    skipTask,
    cancelTask,
    rescheduleTask,
    duplicateTask,
    deleteTask,
    deleteGoal,
    toggleMilestone,
    toggleHabitDate,
    dismissReminder,
    snoozeReminder,
    setIsQuickAddOpen,
    setCurrentView,
    refreshData,
  } = useApp();

  const [isDailyReviewOpen, setIsDailyReviewOpen] = useState(false);
  const [adaptiveAccepted, setAdaptiveAccepted] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDateObj = new Date();
  const formattedToday = todayDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const todayTasks = tasks.filter(t => t.date === todayStr);

  const plannedMinutes = todayTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const completedMinutes = todayTasks
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.actualDuration || t.duration || 0), 0);

  const formatHoursMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const activeGoals = goals.filter(g => g.status === 'active').slice(0, 3);
  const todayReminders = reminders.filter(
    r => !r.isDismissed && (r.targetDate === todayStr || r.triggerAt?.startsWith(todayStr))
  );
  const habitsDueToday = habits;

  // Check adaptive scheduler suggestion
  const adaptiveProposal = !adaptiveAccepted
    ? AdaptiveSchedulerService.generateAdaptiveProposal(tasks, todayStr)
    : null;

  const handleApplyAdaptiveSuggestion = async () => {
    if (!adaptiveProposal) return;
    for (const adj of adaptiveProposal.suggestedAdjustments) {
      if (adj.originalTaskId) {
        await rescheduleTask(adj.originalTaskId, adj.suggestedDate);
      }
    }
    setAdaptiveAccepted(true);
    await refreshData();
  };

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* 1. Header Overview Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-md)',
        }}
      >
        {/* Today Summary */}
        <div
          className="card"
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {formattedToday}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {progress?.completionRate || 0}% Completed
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {todayTasks.filter(t => t.status === 'completed').length} of {todayTasks.length} tasks finished
            </div>
          </div>
        </div>

        {/* Planned vs Completed Time */}
        <div
          className="card"
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--success-subtle)',
              color: 'var(--success-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Award size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Workload Tracking
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline', marginTop: '2px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Planned: </span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {formatHoursMins(plannedMinutes)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Actual: </span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-text)', fontFamily: 'var(--font-mono)' }}>
                  {formatHoursMins(completedMinutes)}
                </span>
              </div>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {plannedMinutes > completedMinutes
                ? `${formatHoursMins(plannedMinutes - completedMinutes)} remaining today`
                : 'Daily planned quota achieved!'}
            </div>
          </div>
        </div>

        {/* Quick Review / Evening Reflection */}
        <div
          className="card"
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Daily Review & Adaptation
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              Review What Happened
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Log reflection to adapt tomorrow
            </div>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setIsDailyReviewOpen(true)}
          >
            Start Review
          </button>
        </div>
      </div>

      {/* 2. Natural Language Task Creation Bar */}
      <NLPQuickAdd onOpenStructuredModal={() => setIsQuickAddOpen(true)} />

      {/* 3. Adaptive Schedule Suggestion Banner */}
      {adaptiveProposal && adaptiveProposal.suggestedAdjustments.length > 0 && (
        <div
          className="card"
          style={{
            padding: '14px 18px',
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
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Adaptive Schedule Adjustment Available
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {adaptiveProposal.analysisSummary}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleApplyAdaptiveSuggestion}
            >
              Accept Adaptation
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setAdaptiveAccepted(true)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 4. Next Task: "What should I do right now?" */}
      <NextTaskCard
        task={nextTask}
        subjects={subjects}
        onStart={startTask}
        onPause={pauseTask}
        onResume={resumeTask}
        onComplete={completeTask}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      {/* 5. Main 2-Column Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.1fr)',
          gap: 'var(--space-xl)',
          alignItems: 'start',
        }}
        className="today-grid"
      >
        {/* Left Column: Today's Tasks */}
        <div>
          <TaskList
            tasks={tasks}
            subjects={subjects}
            onComplete={completeTask}
            onStart={startTask}
            onPause={pauseTask}
            onResume={resumeTask}
            onSkip={skipTask}
            onCancel={cancelTask}
            onDuplicate={duplicateTask}
            onReschedule={rescheduleTask}
            onDelete={deleteTask}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          />
        </div>

        {/* Right Column: Habits, Reminders, Goals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {/* Section: Habits Due Today */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={17} color="#F97316" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Habits Due Today
                </h3>
              </div>
              <button
                className="btn-outline btn-sm"
                style={{ border: 'none', padding: '4px 8px', fontSize: '0.78rem' }}
                onClick={() => setCurrentView('habits')}
              >
                All habits <ArrowRight size={12} style={{ marginLeft: '2px' }} />
              </button>
            </div>

            {habitsDueToday.length === 0 ? (
              <div className="card" style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No habits configured.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {habitsDueToday.map(habit => {
                  const isDoneToday = (habit.completionHistory || []).includes(todayStr);
                  return (
                    <div
                      key={habit.id}
                      className="card"
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isDoneToday ? 'var(--bg-elevated)' : 'var(--bg-card)',
                        borderLeft: isDoneToday ? '3px solid var(--success-text)' : '3px solid transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          className="btn-icon"
                          style={{
                            color: isDoneToday ? 'var(--success-text)' : 'var(--text-muted)',
                            padding: '4px',
                          }}
                          onClick={() => toggleHabitDate(habit.id, todayStr)}
                          title={isDoneToday ? 'Mark as incomplete' : 'Mark as completed'}
                        >
                          <CheckCircle2 size={18} />
                        </button>
                        <div>
                          <div
                            style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              textDecoration: isDoneToday ? 'line-through' : 'none',
                              color: isDoneToday ? 'var(--text-muted)' : 'var(--text-primary)',
                            }}
                          >
                            {habit.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            {habit.frequency} • {habit.streak ?? habit.currentStreak} day streak ({habit.consistencyRate ?? habit.consistencyPercentage}% rate)
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Reminders Due Today */}
          {todayReminders.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)' }}>
                <Bell size={17} color="var(--accent-text)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Reminders ({todayReminders.length})
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {todayReminders.map(rem => (
                  <div
                    key={rem.id}
                    className="card"
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--bg-card)',
                      borderLeft: '3px solid var(--accent-primary)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {rem.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {rem.triggerAt ? `Trigger: ${new Date(rem.triggerAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'All Day'} • {rem.type}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="btn-icon"
                        style={{ padding: '4px', color: 'var(--text-muted)' }}
                        onClick={() => snoozeReminder(rem.id, 15)}
                        title="Snooze 15m"
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                        onClick={() => dismissReminder(rem.id)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Daily Goals */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={17} color="var(--accent-text)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Goals
                </h3>
              </div>
              <button
                className="btn-outline btn-sm"
                style={{ border: 'none', padding: '4px 8px', fontSize: '0.78rem' }}
                onClick={() => setCurrentView('goals')}
              >
                View all <ArrowRight size={12} style={{ marginLeft: '2px' }} />
              </button>
            </div>

            {activeGoals.length === 0 ? (
              <div
                className="card"
                style={{
                  padding: 'var(--space-md)',
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                }}
              >
                No active goals linked yet.
                <button
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '8px', width: '100%' }}
                  onClick={() => setCurrentView('goals')}
                >
                  Create Goal
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {activeGoals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => setCurrentView('goals')}
                    onDelete={deleteGoal}
                    onToggleMilestone={toggleMilestone}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Review Modal */}
      <DailyReviewModal
        isOpen={isDailyReviewOpen}
        onClose={() => setIsDailyReviewOpen(false)}
      />
    </div>
  );
};
