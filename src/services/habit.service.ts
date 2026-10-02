import type { IHabitRepository } from '../data/habit.repository';
import type { Habit, HabitFrequency } from '../types';
import { getTodayDateString } from '../data/initialData';

export class HabitService {
  private readonly habitRepo: IHabitRepository;

  constructor(habitRepo: IHabitRepository) {
    this.habitRepo = habitRepo;
  }

  async getAllHabits(): Promise<Habit[]> {
    return this.habitRepo.getAll();
  }

  async getHabitsDueToday(): Promise<Habit[]> {
    const habits = await this.habitRepo.getAll();
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...

    return habits.filter(h => {
      if (h.frequency === 'daily') return true;
      if (h.frequency === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
      if (h.frequency === 'weekly') return dayOfWeek === 1; // default Monday
      if (h.frequency === 'custom' && h.targetDays) return h.targetDays.includes(dayOfWeek);
      return true;
    });
  }

  async createHabit(input: {
    name: string;
    description?: string;
    frequency: HabitFrequency;
    preferredTime?: string;
    targetDays?: number[];
    goalId?: string;
    color?: string;
    notes?: string;
  }): Promise<Habit> {
    const today = getTodayDateString();
    return this.habitRepo.create({
      name: input.name.trim(),
      description: input.description?.trim(),
      frequency: input.frequency,
      preferredTime: input.preferredTime,
      targetDays: input.targetDays,
      startDate: today,
      goalId: input.goalId,
      color: input.color || '#3B82F6',
      notes: input.notes?.trim(),
      completionHistory: [],
      currentStreak: 0,
      bestStreak: 0,
      consistencyPercentage: 0,
    });
  }

  async toggleHabitDate(habitId: string, date?: string): Promise<Habit> {
    const targetDate = date || getTodayDateString();
    return this.habitRepo.toggleDate(habitId, targetDate);
  }

  async deleteHabit(habitId: string): Promise<boolean> {
    return this.habitRepo.delete(habitId);
  }
}
