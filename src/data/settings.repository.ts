import type { UserSettings } from '../types';
import { LocalStorageClient } from './storage';
import { INITIAL_SETTINGS } from './initialData';

const SETTINGS_STORAGE_KEY = 'ape_settings_v1';

export interface ISettingsRepository {
  getSettings(): Promise<UserSettings>;
  updateSettings(updates: Partial<UserSettings>): Promise<UserSettings>;
}

export class LocalSettingsRepository implements ISettingsRepository {
  async getSettings(): Promise<UserSettings> {
    return LocalStorageClient.get<UserSettings>(SETTINGS_STORAGE_KEY, INITIAL_SETTINGS);
  }

  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getSettings();
    const updated: UserSettings = {
      ...current,
      ...updates,
    };
    LocalStorageClient.set(SETTINGS_STORAGE_KEY, updated);
    return updated;
  }
}

export { LocalSettingsRepository as SettingsRepository };
