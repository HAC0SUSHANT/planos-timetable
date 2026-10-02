import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProgressBar } from '../components/common/ProgressBar';
import { DailyReviewModal } from '../components/reviews/DailyReviewModal';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Flame,
  Target,
  Sparkles,
  BookOpen,
  Award,
} from 'lucide-react';
import type { AIProgressInsight } from '../types';

type Horizon = 'today' | 'week' | 'month';

export const ProgressView: React.FC = () => {
  const {
    tasks,
    goals,
    habits,
    subjects,
    studySessions,
    reviews,
    services,
  } = useApp();

  const [horizon, setHorizon] = useState<Horizon>('week');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Compute dates for horizon
  const todayStr = new Date().toISOString().split('T')[0];

  const getFilteredItems = <T extends { date?: string; createdAt?: string }>(items: T[]): T[] => {
    const now = new Date();
    if (horizon === 'today') {
      return items.filter(i => (i.date || i.createdAt?.split('T')[0]) === todayStr);
    }
    if (horizon === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      return items.filter(i => {
        const d = i.date || i.createdAt?.split('T')[0] || '';
        return d >= weekAgoStr && d <= todayStr;
      });
    }
    // month
    const monthAgo = new Date();
    monthAgo.setDate(now.getDate() - 30);
    const monthAgoStr = monthAgo.toISOString().split('T')[0];
    return items.filter(i => {
      const d = i.date || i.createdAt?.split('T')[0] || '';
      return d >= monthAgoStr && d <= todayStr;
    });
  };

  const periodTasks = getFilteredItems(tasks);

  // Task metrics
  const totalTasks = periodTasks.length;
  const completedTasks = periodTasks.filter(t => t.status === 'completed').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Study time metrics
  const totalStudyMinutes = studySessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0);
  const plannedStudyMinutes = studySessions.reduce((sum, s) => sum + (s.plannedDuration || 0), 0);

  const formatHoursMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  // Habit metrics
  const avgHabitConsistency = habits.length > 0
    ? Math.round(habits.reduce((acc, h) => acc + (h.consistencyRate || 0), 0) / habits.length)
    : 0;

  // Goal metrics
  const activeGoals = goals.filter(g => g.status === 'active');
  const avgGoalProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((acc, g) => acc + (g.progress || 0), 0) / activeGoals.length)
    : 0;

  // Subject study breakdown
  const subjectStudyMap: Record<string, number> = {};
  for (const s of studySessions) {
    subjectStudyMap[s.subjectId] = (subjectStudyMap[s.subjectId] || 0) + (s.actualDuration || 0);
  }

  const subjectStudyList = subjects.map(sub => {
    const mins = subjectStudyMap[sub.id] || sub.totalStudyMinutes || 0;
    return {
      subject: sub,
      minutes: mins,
    };
  }).sort((a, b) => b.minutes - a.minutes);

  const maxSubjectMinutes = Math.max(1, ...subjectStudyList.map(s => s.minutes));

  // AI Progress Analysis Insights (Real observations)
  const insights = services.aiAgentService.analyzeProgress(tasks, studySessions, habits, goals);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* Top Header & Horizon Switcher */}
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
            Progress & Performance Analytics
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Mathematical execution metrics derived from verified local tasks, study logs, and habit streaks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            <button
              className={`btn btn-sm ${horizon === 'today' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', padding: '4px 12px', fontSize: '0.78rem' }}
              onClick={() => setHorizon('today')}
            >
              Today
            </button>
            <button
              className={`btn btn-sm ${horizon === 'week' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', padding: '4px 12px', fontSize: '0.78rem' }}
              onClick={() => setHorizon('week')}
            >
              This Week
            </button>
            <button
              className={`btn btn-sm ${horizon === 'month' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', padding: '4px 12px', fontSize: '0.78rem' }}
              onClick={() => setHorizon('month')}
            >
              This Month
            </button>
          </div>

          <button className="btn btn-outline" onClick={() => setIsReviewModalOpen(true)}>
            <Award size={15} /> Daily Review
          </button>
        </div>
      </div>

      {/* High-Level 4 Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 'var(--space-md)',
        }}
      >
        {/* Total Study Time */}
        <div className="card" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Study Time
            </span>
            <Clock size={16} color="var(--accent-text)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {formatHoursMins(totalStudyMinutes)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Planned: {formatHoursMins(plannedStudyMinutes)}
          </div>
        </div>

        {/* Task Completion Rate */}
        <div className="card" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Task Completion
            </span>
            <CheckCircle2 size={16} color="var(--success-text)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--success-text)' }}>
            {taskCompletionRate}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {completedTasks} / {totalTasks} tasks completed
          </div>
        </div>

        {/* Habit Consistency */}
        <div className="card" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Habit Consistency
            </span>
            <Flame size={16} color="#F97316" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {avgHabitConsistency}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Across {habits.length} active habits
          </div>
        </div>

        {/* Goals Progress */}
        <div className="card" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Goal Alignment
            </span>
            <Target size={16} color="var(--accent-text)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-text)' }}>
            {avgGoalProgress}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {activeGoals.length} active goals tracked
          </div>
        </div>
      </div>

      {/* 2-Column Section: Subject Breakdown & AI Insights */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1.2fr)',
          gap: 'var(--space-xl)',
        }}
        className="today-grid"
      >
        {/* Left: Subject Study Time Distribution */}
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="var(--accent-text)" />
              Subject Study Distribution
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real Logged Minutes</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {subjectStudyList.map(item => {
              const pct = Math.round((item.minutes / maxSubjectMinutes) * 100);
              return (
                <div key={item.subject.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: item.subject.color,
                        }}
                      />
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.subject.name}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.825rem', fontWeight: 600 }}>
                      {formatHoursMins(item.minutes)}
                    </span>
                  </div>
                  <ProgressBar value={pct} height={8} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: AI Behavioral & Execution Insights */}
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--accent-text)" />
              AI Performance Observations
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Data-Derived Only</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {insights.map((insight: AIProgressInsight, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid var(--accent-primary)',
                  fontSize: '0.825rem',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {insight.title}
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {insight.observation}
                </div>
                {insight.recommendation && (
                  <div style={{ color: 'var(--accent-text)', marginTop: '4px', fontSize: '0.78rem', fontWeight: 500 }}>
                    💡 Suggestion: {insight.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Daily Reviews History */}
      <div className="card" style={{ padding: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--accent-text)" />
            Recent Daily Reviews & Reflections
          </h3>
          <button className="btn btn-outline btn-sm" onClick={() => setIsReviewModalOpen(true)}>
            + Log New Review
          </button>
        </div>

        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No daily reviews logged yet. Complete today's session and log your reflection to inform tomorrow's plan.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reviews.slice(0, 5).map(rev => (
              <div
                key={rev.id}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {new Date(rev.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                  <span style={{ color: 'var(--accent-text)', fontWeight: 600, fontSize: '0.85rem' }}>
                    {'★'.repeat(rev.energyRating || 5)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div>
                    <strong style={{ color: 'var(--success-text)' }}>Went well:</strong> {rev.whatWentWell}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--warning-text)' }}>Adjust tomorrow:</strong> {rev.whatToChange}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Review Modal */}
      <DailyReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
    </div>
  );
};
