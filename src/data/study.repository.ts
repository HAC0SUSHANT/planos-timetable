import type { StudySession } from '../types';
import { LocalStorageClient } from './storage';
import { getInitialStudySessions } from './initialData';

const STUDY_SESSIONS_STORAGE_KEY = 'ape_study_sessions_v1';

export interface IStudyRepository {
  getAllSessions(): Promise<StudySession[]>;
  getBySubjectId(subjectId: string): Promise<StudySession[]>;
  getByDate(date: string): Promise<StudySession[]>;
  createSession(session: Omit<StudySession, 'id' | 'createdAt'>): Promise<StudySession>;
  deleteSession(id: string): Promise<boolean>;
}

export class LocalStudyRepository implements IStudyRepository {
  private getSessions(): StudySession[] {
    const stored = LocalStorageClient.get<StudySession[] | null>(STUDY_SESSIONS_STORAGE_KEY, null);
    if (!stored || stored.length === 0) {
      const initial = getInitialStudySessions();
      LocalStorageClient.set(STUDY_SESSIONS_STORAGE_KEY, initial);
      return initial;
    }
    return stored;
  }

  private saveSessions(sessions: StudySession[]): void {
    LocalStorageClient.set(STUDY_SESSIONS_STORAGE_KEY, sessions);
  }

  async getAllSessions(): Promise<StudySession[]> {
    return this.getSessions().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getBySubjectId(subjectId: string): Promise<StudySession[]> {
    return this.getSessions().filter(s => s.subjectId === subjectId);
  }

  async getByDate(date: string): Promise<StudySession[]> {
    return this.getSessions().filter(s => s.date === date);
  }

  async createSession(session: Omit<StudySession, 'id' | 'createdAt'>): Promise<StudySession> {
    const sessions = this.getSessions();
    const newSession: StudySession = {
      ...session,
      id: `ses-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    sessions.unshift(newSession);
    this.saveSessions(sessions);
    return newSession;
  }

  async deleteSession(id: string): Promise<boolean> {
    const sessions = this.getSessions();
    const filtered = sessions.filter(s => s.id !== id);
    if (filtered.length !== sessions.length) {
      this.saveSessions(filtered);
      return true;
    }
    return false;
  }
}

export { LocalStudyRepository as StudyRepository };
