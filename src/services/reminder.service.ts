import type { IReminderRepository } from '../data/reminder.repository';
import type { Reminder } from '../types';

export class ReminderService {
  private readonly reminderRepo: IReminderRepository;

  constructor(reminderRepo: IReminderRepository) {
    this.reminderRepo = reminderRepo;
  }

  async getAllReminders(): Promise<Reminder[]> {
    return this.reminderRepo.getAll();
  }

  async getActiveDueReminders(): Promise<Reminder[]> {
    const all = await this.reminderRepo.getAll();
    const nowISO = new Date().toISOString();

    return all.filter(r => {
      if (r.isDismissed) return false;
      const effectiveTrigger = r.snoozeUntil || r.triggerAt;
      return effectiveTrigger <= nowISO;
    });
  }

  async createReminder(input: Omit<Reminder, 'id' | 'createdAt' | 'isTriggered' | 'isDismissed'>): Promise<Reminder> {
    return this.reminderRepo.create({
      ...input,
      isTriggered: false,
      isDismissed: false,
    });
  }

  async dismissReminder(id: string): Promise<Reminder> {
    return this.reminderRepo.dismiss(id);
  }

  async snoozeReminder(id: string, minutes: number): Promise<Reminder> {
    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes);
    return this.reminderRepo.snooze(id, snoozeTime.toISOString());
  }

  async deleteReminder(id: string): Promise<boolean> {
    return this.reminderRepo.delete(id);
  }

  /**
   * Dispatches web browser notification if permitted
   */
  static async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const res = await Notification.requestPermission();
      return res === 'granted';
    }
    return false;
  }

  async rescheduleTaskReminder(taskId: string, newDate: string, newTime?: string): Promise<void> {
    const all = await this.reminderRepo.getAll();
    const related = all.filter(r => r.relatedTaskId === taskId);
    for (const r of related) {
      await this.reminderRepo.update(r.id, {
        targetDate: newDate,
        targetTime: newTime || r.targetTime,
        isDismissed: false,
      });
    }
  }

  async getDueReminders(date: string, time?: string): Promise<Reminder[]> {
    const all = await this.reminderRepo.getAll();
    return all.filter(r => r.targetDate === date && (!time || r.targetTime === time));
  }

  static dispatchBrowserNotification(title: string, body: string): void {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/vite.svg' });
      } catch (e) {
        console.warn('Browser notification failed:', e);
      }
    }
  }
}
