import { describe, it, expect, beforeEach } from 'vitest';
import { TaskRepository } from '../data/task.repository';
import { TaskService } from '../services/task.service';

describe('Task System & Recurrence', () => {
  let taskRepo: TaskRepository;
  let taskService: TaskService;

  beforeEach(() => {
    // Clear storage key for test isolation
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    taskRepo = new TaskRepository();
    taskService = new TaskService(taskRepo);
  });

  it('creates, reads, updates, and completes a task', async () => {
    const today = new Date().toISOString().split('T')[0];
    const created = await taskService.createTask({
      title: 'Study Physics — Electrostatics',
      duration: 60,
      priority: 'high',
      date: today,
      startTime: '19:00',
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Study Physics — Electrostatics');
    expect(created.status).toBe('pending');
    expect(created.duration).toBe(60);

    // Update status to in_progress
    const started = await taskService.startTask(created.id);
    expect(started.status).toBe('in_progress');

    // Pause task
    const paused = await taskService.pauseTask(created.id);
    expect(paused.status).toBe('paused');

    // Resume task
    const resumed = await taskService.resumeTask(created.id);
    expect(resumed.status).toBe('in_progress');

    // Complete task
    const completed = await taskService.completeTask(created.id);
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeDefined();
  });

  it('skips, cancels, and reschedules tasks cleanly', async () => {
    const today = new Date().toISOString().split('T')[0];
    const task = await taskService.createTask({
      title: 'Workout Session',
      duration: 45,
      priority: 'medium',
      date: today,
    });

    // Skip
    const skipped = await taskService.skipTask(task.id);
    expect(skipped.status).toBe('skipped');

    // Reschedule
    const tomorrow = '2026-10-03';
    const rescheduled = await taskService.rescheduleTask(task.id, tomorrow, '07:00');
    expect(rescheduled.date).toBe(tomorrow);
    expect(rescheduled.startTime).toBe('07:00');
    expect(rescheduled.status).toBe('pending');
  });

  it('duplicates a task correctly', async () => {
    const task = await taskService.createTask({
      title: 'Practice Calculus Problems',
      date: '2026-10-02',
      duration: 60,
      priority: 'critical',
      notes: 'Focus on chain rule',
    });

    const dup = await taskService.duplicateTask(task.id);
    expect(dup.id).not.toBe(task.id);
    expect(dup.title).toContain('Practice Calculus Problems');
    expect(dup.duration).toBe(60);
    expect(dup.priority).toBe('critical');
    expect(dup.status).toBe('pending');
  });

  it('generates recurring task occurrences correctly for daily recurrence', async () => {
    const baseTask = await taskService.createTask({
      title: 'Daily Vocabulary Review',
      duration: 20,
      priority: 'low',
      date: '2026-10-01',
      recurrence: {
        frequency: 'daily',
        interval: 1,
        endCondition: 'count',
        maxOccurrences: 5,
      },
    });

    const instances = await taskService.generateRecurringInstances(baseTask, 7);
    expect(instances.length).toBe(4); // 4 additional instances up to maxOccurrences 5
    expect(instances[0].date).toBe('2026-10-02');
    expect(instances[1].date).toBe('2026-10-03');
    expect(instances[2].date).toBe('2026-10-04');
    expect(instances[3].date).toBe('2026-10-05');
  });
});
