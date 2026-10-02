import type { ITaskRepository } from '../data/repository.interface';
import type { DailyProgress } from '../types';
import { getTodayDateString } from '../data/initialData';

export class ProgressService {
  private readonly taskRepo: ITaskRepository;

  constructor(taskRepo: ITaskRepository) {
    this.taskRepo = taskRepo;
  }

  async getDailyProgress(date?: string): Promise<DailyProgress> {
    const targetDate = date || getTodayDateString();
    const tasks = await this.taskRepo.getByDate(targetDate);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const cancelledTasks = tasks.filter(t => t.status === 'cancelled').length;
    const skippedTasks = tasks.filter(t => t.status === 'skipped').length;

    // Has enough data if there is at least 1 task scheduled for today
    const hasEnoughData = totalTasks > 0;

    // Daily task completion formula: completed tasks / total scheduled tasks
    const completionRate = hasEnoughData 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    const totalMinutesScheduled = tasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const totalMinutesCompleted = tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.duration || 0), 0);

    return {
      date: targetDate,
      totalTasks,
      completedTasks,
      inProgressTasks,
      cancelledTasks,
      skippedTasks,
      completionRate,
      totalMinutesScheduled,
      totalMinutesCompleted,
      hasEnoughData,
    };
  }

  async calculateDailyProgress(date?: string): Promise<DailyProgress> {
    return this.getDailyProgress(date);
  }
}
