import type { Task, UserSettings } from '../types';

export interface ScheduleConflict {
  taskA: Task;
  taskB: Task;
  overlapMinutes: number;
}

export interface WorkloadAudit {
  date: string;
  totalPlannedMinutes: number;
  availableMinutes: number;
  isOverloaded: boolean;
  overflowMinutes: number;
  conflicts: ScheduleConflict[];
  recommendedScheduleToday: Task[];
  recommendedPostponedTasks: Task[];
  adviceMessage?: string;
}

export class SchedulingEngineService {
  /**
   * Detects overlapping time conflicts between scheduled tasks on a given date.
   */
  static detectConflicts(tasks: Task[]): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];
    const timedTasks = tasks
      .filter(t => t.startTime && t.status !== 'cancelled' && t.status !== 'skipped')
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    for (let i = 0; i < timedTasks.length; i++) {
      for (let j = i + 1; j < timedTasks.length; j++) {
        const t1 = timedTasks[i];
        const t2 = timedTasks[j];

        const [h1, m1] = t1.startTime!.split(':').map(Number);
        const start1 = h1 * 60 + m1;
        const end1 = t1.endTime ? (() => {
          const [eh, em] = t1.endTime.split(':').map(Number);
          return eh * 60 + em;
        })() : start1 + t1.duration;

        const [h2, m2] = t2.startTime!.split(':').map(Number);
        const start2 = h2 * 60 + m2;
        const end2 = t2.endTime ? (() => {
          const [eh, em] = t2.endTime.split(':').map(Number);
          return eh * 60 + em;
        })() : start2 + t2.duration;

        // Overlap condition: start1 < end2 && start2 < end1
        if (start1 < end2 && start2 < end1) {
          const overlap = Math.min(end1, end2) - Math.max(start1, start2);
          if (overlap > 0) {
            conflicts.push({
              taskA: t1,
              taskB: t2,
              overlapMinutes: overlap,
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Audits daily workload against available user capacity.
   * If tasks exceed available hours, identifies overflow and prioritizes critical/high tasks.
   */
  static auditWorkload(tasks: Task[], settings: UserSettings, date: string): WorkloadAudit {
    const activeTasks = tasks.filter(t => t.status !== 'cancelled' && t.status !== 'skipped');
    const totalPlannedMinutes = activeTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const availableMinutes = Math.round((settings.availableHours || 6.0) * 60);

    const conflicts = this.detectConflicts(tasks);
    const isOverloaded = totalPlannedMinutes > availableMinutes;
    const overflowMinutes = isOverloaded ? totalPlannedMinutes - availableMinutes : 0;

    // Prioritize tasks
    const priorityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const sortedTasks = [...activeTasks].sort((a, b) => {
      // Completed tasks stay in today's schedule
      if (a.status === 'completed' && b.status !== 'completed') return -1;
      if (b.status === 'completed' && a.status !== 'completed') return 1;
      return (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
    });

    const recommendedToday: Task[] = [];
    const recommendedPostponed: Task[] = [];

    let accumulatedMinutes = 0;
    for (const t of sortedTasks) {
      if (t.status === 'completed' || accumulatedMinutes + t.duration <= availableMinutes) {
        recommendedToday.push(t);
        accumulatedMinutes += t.duration;
      } else {
        recommendedPostponed.push(t);
      }
    }

    let adviceMessage: string | undefined;
    if (isOverloaded) {
      const plannedHoursStr = (totalPlannedMinutes / 60).toFixed(1);
      const availHoursStr = (availableMinutes / 60).toFixed(1);
      adviceMessage = `You have ${plannedHoursStr}h of tasks but only ${availHoursStr}h of available time. We recommend focusing on ${recommendedToday.length} prioritized tasks today and moving ${recommendedPostponed.length} tasks to tomorrow.`;
    }

    return {
      date,
      totalPlannedMinutes,
      availableMinutes,
      isOverloaded,
      overflowMinutes,
      conflicts,
      recommendedScheduleToday: recommendedToday,
      recommendedPostponedTasks: recommendedPostponed,
      adviceMessage,
    };
  }
}
