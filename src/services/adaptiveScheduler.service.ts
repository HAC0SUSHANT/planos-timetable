import type { Task } from '../types';
import { getPastDateString } from '../data/initialData';

export interface AdaptiveTaskAdjustment {
  originalTaskId?: string;
  title: string;
  category?: string;
  subjectId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  duration: number; // in minutes
  reason: string;
  suggestedDate: string; // usually tomorrow
}

export interface AdaptivePlanProposal {
  analysisSummary: string;
  totalPlannedYesterday: number;
  totalActualYesterday: number;
  deficitMinutes: number;
  missedTasksCount: number;
  shortenedTasksCount: number;
  suggestedAdjustments: AdaptiveTaskAdjustment[];
}

export class AdaptiveSchedulerService {
  /**
   * Evaluates planned vs actual metrics for a given past date (or today)
   * and formulates a supportive, non-punitive adaptive plan for tomorrow.
   */
  static generateAdaptiveProposal(tasks: Task[], targetDate?: string): AdaptivePlanProposal | null {
    const evalDate = targetDate || getPastDateString(0);
    const dayTasks = tasks.filter(t => t.date === evalDate);

    if (dayTasks.length === 0) return null;

    let totalPlanned = 0;
    let totalActual = 0;
    const adjustments: AdaptiveTaskAdjustment[] = [];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    let missedCount = 0;
    let shortenedCount = 0;
    const analysisPoints: string[] = [];

    for (const task of dayTasks) {
      const planned = task.duration || 0;
      const actual = task.actualDuration || (task.status === 'completed' ? planned : 0);
      totalPlanned += planned;
      totalActual += actual;

      // 1. Task uncompleted or missed
      if (task.status === 'pending' || task.status === 'skipped' || task.status === 'paused') {
        missedCount++;
        analysisPoints.push(`"${task.title}" was not completed (${planned}m).`);
        adjustments.push({
          originalTaskId: task.id,
          title: task.title,
          category: task.category,
          subjectId: task.subjectId,
          priority: task.priority === 'critical' ? 'critical' : 'high',
          duration: planned,
          reason: 'Uncompleted task rescheduled to maintain momentum.',
          suggestedDate: tomorrowStr,
        });
      } 
      // 2. Task completed but substantially shorter than planned (>15m deficit)
      else if (task.status === 'completed' && actual < planned - 15) {
        shortenedCount++;
        const deficit = planned - actual;
        analysisPoints.push(`"${task.title}" session was ${deficit}m shorter than planned.`);
        adjustments.push({
          originalTaskId: task.id,
          title: `${task.title} (Revision & Drills)`,
          category: task.category,
          subjectId: task.subjectId,
          priority: 'medium',
          duration: Math.max(30, Math.min(60, deficit)),
          reason: `Quick follow-up revision (${deficit}m deficit from previous session).`,
          suggestedDate: tomorrowStr,
        });
      }
    }

    if (adjustments.length === 0) {
      return null; // Plan was executed perfectly!
    }

    const deficitMinutes = Math.max(0, totalPlanned - totalActual);
    const summary = analysisPoints.slice(0, 3).join(' ');

    return {
      analysisSummary: summary,
      totalPlannedYesterday: totalPlanned,
      totalActualYesterday: totalActual,
      deficitMinutes,
      missedTasksCount: missedCount,
      shortenedTasksCount: shortenedCount,
      suggestedAdjustments: adjustments,
    };
  }

  static generateAdaptiveSuggestion(targetDate: string, tasks: Task[]): { summary: string; adjustments: { taskId: string; action: string; suggestedDate: string; suggestedStartTime?: string }[] } | null {
    const proposal = this.generateAdaptiveProposal(tasks, targetDate);
    if (!proposal) return null;
    return {
      summary: proposal.analysisSummary,
      adjustments: proposal.suggestedAdjustments.map(a => ({
        taskId: a.originalTaskId || '',
        action: 'reschedule',
        suggestedDate: a.suggestedDate,
        suggestedStartTime: '08:00',
      })),
    };
  }

  generateAdaptiveSuggestion(targetDate: string, tasks: Task[]) {
    return AdaptiveSchedulerService.generateAdaptiveSuggestion(targetDate, tasks);
  }
}
