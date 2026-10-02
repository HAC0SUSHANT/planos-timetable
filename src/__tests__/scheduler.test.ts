import { describe, it, expect } from 'vitest';
import { SchedulingEngineService } from '../services/schedulingEngine.service';
import { AdaptiveSchedulerService } from '../services/adaptiveScheduler.service';
import type { Task, UserSettings } from '../types';

describe('Realistic Scheduling Engine & Adaptive Balancer', () => {
  it('detects overlapping time conflicts between scheduled tasks accurately', () => {
    const tasks: Task[] = [
      {
        id: 't-1',
        title: 'Physics',
        duration: 90,
        startTime: '07:00',
        endTime: '08:30',
        status: 'pending',
        priority: 'high',
        date: '2026-10-02',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 't-2',
        title: 'Python',
        duration: 60,
        startTime: '08:00',
        endTime: '09:00',
        status: 'pending',
        priority: 'medium',
        date: '2026-10-02',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 't-3',
        title: 'Maths',
        duration: 60,
        startTime: '10:00',
        endTime: '11:00',
        status: 'pending',
        priority: 'low',
        date: '2026-10-02',
        createdAt: '',
        updatedAt: '',
      },
    ];

    const conflicts = SchedulingEngineService.detectConflicts(tasks);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].taskA.title).toBe('Physics');
    expect(conflicts[0].taskB.title).toBe('Python');
    expect(conflicts[0].overlapMinutes).toBe(30); // 08:00 to 08:30 is 30 mins
  });

  it('audits daily workload against available hours and detects overflow', () => {
    // User has 4 available hours (240 min)
    const mockSettings: UserSettings = {
      theme: 'dark',
      dayStartHour: 6,
      sleepHours: { start: '23:00', end: '07:00' },
      availableHours: 4.0,
      defaultTaskDuration: 45,
      defaultBreakDuration: 10,
      reminderPreferences: { taskReminderMinutesBefore: 10, habitReminders: true, soundEnabled: true },
      quietHours: { start: '22:00', end: '07:00', enabled: false },
      weekStartDay: 'monday',
      timeFormat: '12h',
      aiAutomationLevel: 'assisted',
    } as any;

    // User has 7 hours of tasks (420 min)
    const heavyTasks: Task[] = [
      { id: 't1', title: 'Task Critical', duration: 120, priority: 'critical', status: 'pending', date: '2026-10-02', createdAt: '', updatedAt: '' },
      { id: 't2', title: 'Task High', duration: 120, priority: 'high', status: 'pending', date: '2026-10-02', createdAt: '', updatedAt: '' },
      { id: 't3', title: 'Task Medium', duration: 90, priority: 'medium', status: 'pending', date: '2026-10-02', createdAt: '', updatedAt: '' },
      { id: 't4', title: 'Task Low', duration: 90, priority: 'low', status: 'pending', date: '2026-10-02', createdAt: '', updatedAt: '' },
    ];

    const audit = SchedulingEngineService.auditWorkload(heavyTasks, mockSettings, '2026-10-02');

    expect(audit.isOverloaded).toBe(true);
    expect(audit.totalPlannedMinutes).toBe(420);
    expect(audit.availableMinutes).toBe(240);
    expect(audit.overflowMinutes).toBe(180);

    // Recommended today should prioritize critical and high
    expect(audit.recommendedScheduleToday.length).toBe(2);
    expect(audit.recommendedScheduleToday[0].title).toBe('Task Critical');
    expect(audit.recommendedScheduleToday[1].title).toBe('Task High');

    // Overflow tasks should be postponed
    expect(audit.recommendedPostponedTasks.length).toBe(2);
    expect(audit.adviceMessage).toContain('You have 7.0h of tasks but only 4.0h of available time');
  });

  it('generates adaptive adjustments for incomplete or shortened study sessions', () => {
    const today = '2026-10-02';
    const dayTasks: Task[] = [
      {
        id: 'task-phys',
        title: 'Physics',
        duration: 60,
        actualDuration: 45, // 15m shorter than planned
        status: 'completed',
        priority: 'high',
        date: today,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'task-math',
        title: 'Maths',
        duration: 60,
        actualDuration: 0,
        status: 'pending', // uncompleted
        priority: 'high',
        date: today,
        createdAt: '',
        updatedAt: '',
      },
    ];

    const suggestion = AdaptiveSchedulerService.generateAdaptiveSuggestion(today, dayTasks);

    expect(suggestion).toBeDefined();
    expect(suggestion!.adjustments.length).toBeGreaterThan(0);
    expect(suggestion!.summary).toContain('Maths');
  });
});
