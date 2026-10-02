import { describe, it, expect, beforeEach } from 'vitest';
import { HabitRepository } from '../data/habit.repository';
import { HabitService } from '../services/habit.service';

describe('Habit Tracker & Consistency Calculations', () => {
  let habitRepo: HabitRepository;
  let habitService: HabitService;

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    habitRepo = new HabitRepository();
    habitService = new HabitService(habitRepo);
  });

  it('calculates streaks and allows missed days without corrupting data', async () => {
    const habit = await habitService.createHabit({
      name: 'Workout',
      frequency: 'daily',
      preferredTime: '06:00',
    });

    expect(habit.streak).toBe(0);
    expect(habit.consistencyRate).toBe(0);

    // Toggle today completed
    const today = new Date().toISOString().split('T')[0];
    const toggledToday = await habitService.toggleHabitDate(habit.id, today);

    expect(toggledToday.streak).toBe(1);
    expect(toggledToday.completionHistory?.includes(today)).toBe(true);

    // Toggle yesterday completed
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const toggledYesterday = await habitService.toggleHabitDate(habit.id, yesterdayStr);
    expect(toggledYesterday.streak).toBe(2);

    // Verify consistency rate computation
    expect(toggledYesterday.consistencyRate).toBeGreaterThan(0);

    // Allow untoggling (e.g. user toggled by mistake)
    const untoggled = await habitService.toggleHabitDate(habit.id, today);
    expect(untoggled.completionHistory?.includes(today)).toBe(false);
  });
});
