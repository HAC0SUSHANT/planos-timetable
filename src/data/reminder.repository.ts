import type { Reminder } from '../types';
import { LocalStorageClient } from './storage';
import { getInitialReminders } from './initialData';

const REMINDERS_STORAGE_KEY = 'ape_reminders_v1';

export interface IReminderRepository {
  getAll(): Promise<Reminder[]>;
  create(reminder: Omit<Reminder, 'id' | 'createdAt'>): Promise<Reminder>;
  update(id: string, updates: Partial<Reminder>): Promise<Reminder>;
  delete(id: string): Promise<boolean>;
  dismiss(id: string): Promise<Reminder>;
  snooze(id: string, untilDateISO: string): Promise<Reminder>;
}

export class LocalReminderRepository implements IReminderRepository {
  private getReminders(): Reminder[] {
    const stored = LocalStorageClient.get<Reminder[] | null>(REMINDERS_STORAGE_KEY, null);
    if (!stored || stored.length === 0) {
      const initial = getInitialReminders();
      LocalStorageClient.set(REMINDERS_STORAGE_KEY, initial);
      return initial;
    }
    return stored;
  }

  private saveReminders(reminders: Reminder[]): void {
    LocalStorageClient.set(REMINDERS_STORAGE_KEY, reminders);
  }

  async getAll(): Promise<Reminder[]> {
    return this.getReminders();
  }

  async create(reminder: Omit<Reminder, 'id' | 'createdAt'>): Promise<Reminder> {
    const reminders = this.getReminders();
    const newRem: Reminder = {
      ...reminder,
      id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    reminders.push(newRem);
    this.saveReminders(reminders);
    return newRem;
  }

  async update(id: string, updates: Partial<Reminder>): Promise<Reminder> {
    const reminders = this.getReminders();
    const idx = reminders.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Reminder ${id} not found`);

    const updated = { ...reminders[idx], ...updates };
    reminders[idx] = updated;
    this.saveReminders(reminders);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const reminders = this.getReminders();
    const filtered = reminders.filter(r => r.id !== id);
    if (filtered.length !== reminders.length) {
      this.saveReminders(filtered);
      return true;
    }
    return false;
  }

  async dismiss(id: string): Promise<Reminder> {
    return this.update(id, { isDismissed: true });
  }

  async snooze(id: string, untilDateISO: string): Promise<Reminder> {
    return this.update(id, { snoozeUntil: untilDateISO, isDismissed: false });
  }
}

export { LocalReminderRepository as ReminderRepository };

