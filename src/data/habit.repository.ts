import type { Habit } from '../types';
import { LocalStorageClient } from './storage';
import { getInitialHabits } from './initialData';

const HABITS_STORAGE_KEY = 'ape_habits_v2';

export interface IHabitRepository {
  getAll(): Promise<Habit[]>;
  getById(id: string): Promise<Habit | null>;
  create(item: Omit<Habit, 'id' | 'createdAt'>): Promise<Habit>;
  update(id: string, updates: Partial<Habit>): Promise<Habit>;
  delete(id: string): Promise<boolean>;
  toggleDate(habitId: string, date: string): Promise<Habit>;
}

export class LocalHabitRepository implements IHabitRepository {
  private getHabits(): Habit[] {
    const stored = LocalStorageClient.get<Habit[] | null>(HABITS_STORAGE_KEY, null);
    if (!stored || stored.length === 0) {
      const initial = getInitialHabits();
      LocalStorageClient.set(HABITS_STORAGE_KEY, initial);
      return initial;
    }
    return stored;
  }

  private saveHabits(habits: Habit[]): void {
    LocalStorageClient.set(HABITS_STORAGE_KEY, habits);
  }

  async getAll(): Promise<Habit[]> {
    return this.getHabits();
  }

  async getById(id: string): Promise<Habit | null> {
    const habits = this.getHabits();
    return habits.find(h => h.id === id) || null;
  }

  async create(item: Omit<Habit, 'id' | 'createdAt'>): Promise<Habit> {
    const habits = this.getHabits();
    const newHabit: Habit = {
      ...item,
      currentStreak: item.currentStreak ?? item.streak ?? 0,
      streak: item.streak ?? item.currentStreak ?? 0,
      bestStreak: item.bestStreak ?? 0,
      consistencyPercentage: item.consistencyPercentage ?? item.consistencyRate ?? 0,
      consistencyRate: item.consistencyRate ?? item.consistencyPercentage ?? 0,
      completionHistory: item.completionHistory ?? [],
      id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    habits.unshift(newHabit);
    this.saveHabits(habits);
    return newHabit;
  }

  async update(id: string, updates: Partial<Habit>): Promise<Habit> {
    const habits = this.getHabits();
    const idx = habits.findIndex(h => h.id === id);
    if (idx === -1) throw new Error(`Habit ${id} not found`);

    const updated = { ...habits[idx], ...updates };
    habits[idx] = updated;
    this.saveHabits(habits);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const habits = this.getHabits();
    const filtered = habits.filter(h => h.id !== id);
    if (filtered.length !== habits.length) {
      this.saveHabits(filtered);
      return true;
    }
    return false;
  }

  async toggleDate(habitId: string, date: string): Promise<Habit> {
    const habits = this.getHabits();
    const idx = habits.findIndex(h => h.id === habitId);
    if (idx === -1) throw new Error(`Habit ${habitId} not found`);

    const habit = habits[idx];
    const history = [...habit.completionHistory];
    const exists = history.includes(date);

    let updatedHistory: string[];
    if (exists) {
      updatedHistory = history.filter(d => d !== date);
    } else {
      updatedHistory = [...history, date].sort();
    }

    // Recompute streak and consistency
    const stats = this.computeHabitStats(updatedHistory);

    const updatedHabit: Habit = {
      ...habit,
      completionHistory: updatedHistory,
      currentStreak: stats.currentStreak,
      streak: stats.currentStreak,
      bestStreak: Math.max(habit.bestStreak, stats.currentStreak),
      consistencyPercentage: stats.consistency,
      consistencyRate: stats.consistency,
    };

    habits[idx] = updatedHabit;
    this.saveHabits(habits);
    return updatedHabit;
  }

  private computeHabitStats(history: string[]): { currentStreak: number; consistency: number } {
    let currentStreak = 0;
    
    // Check backwards from today or yesterday
    const checkDate = new Date();
    // If today is completed, start from today, else start from yesterday
    const todayStr = checkDate.toISOString().split('T')[0];
    let startOffset = history.includes(todayStr) ? 0 : 1;

    for (let i = startOffset; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      if (history.includes(str)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Consistency over past 30 days
    let completedIn30Days = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      if (history.includes(str)) {
        completedIn30Days++;
      }
    }
    const consistency = Math.round((completedIn30Days / 30) * 100);

    return { currentStreak, consistency };
  }
}

export { LocalHabitRepository as HabitRepository };
