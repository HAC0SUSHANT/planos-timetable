import type { Subject, Topic } from '../types';
import type { ISubjectRepository } from './repository.interface';
import { LocalStorageClient } from './storage';
import { INITIAL_SUBJECTS } from './initialData';

const SUBJECTS_STORAGE_KEY = 'ape_subjects_v1';

export class LocalSubjectRepository implements ISubjectRepository {
  private getSubjects(): Subject[] {
    const stored = LocalStorageClient.get<Subject[] | null>(SUBJECTS_STORAGE_KEY, null);
    if (!stored || stored.length === 0) {
      LocalStorageClient.set(SUBJECTS_STORAGE_KEY, INITIAL_SUBJECTS);
      return INITIAL_SUBJECTS;
    }
    return stored;
  }

  private saveSubjects(subjects: Subject[]): void {
    LocalStorageClient.set(SUBJECTS_STORAGE_KEY, subjects);
  }

  async getAll(): Promise<Subject[]> {
    return this.getSubjects();
  }

  async getById(id: string): Promise<Subject | null> {
    const subjects = this.getSubjects();
    return subjects.find(s => s.id === id) || null;
  }

  async create(item: Omit<Subject, 'id'>): Promise<Subject> {
    const subjects = this.getSubjects();
    const newSub: Subject = {
      ...item,
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      topics: item.topics || [],
      totalStudyMinutes: item.totalStudyMinutes || 0,
      questionsAttempted: item.questionsAttempted || 0,
      questionsCorrect: item.questionsCorrect || 0,
      accuracyRate: item.questionsAttempted ? Math.round(((item.questionsCorrect || 0) / item.questionsAttempted) * 100) : 0,
    };
    subjects.push(newSub);
    this.saveSubjects(subjects);
    return newSub;
  }

  async update(id: string, updates: Partial<Subject>): Promise<Subject> {
    const subjects = this.getSubjects();
    const idx = subjects.findIndex(s => s.id === id);
    if (idx === -1) throw new Error(`Subject ${id} not found`);

    const updated = { ...subjects[idx], ...updates };
    subjects[idx] = updated;
    this.saveSubjects(subjects);
    return updated;
  }

  async addTopic(subjectId: string, topic: Omit<Topic, 'id' | 'subjectId'>): Promise<Subject> {
    const subject = await this.getById(subjectId);
    if (!subject) throw new Error(`Subject ${subjectId} not found`);

    const newTopic: Topic = {
      ...topic,
      id: `top-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subjectId,
    };

    const topics = [...(subject.topics || []), newTopic];
    return this.update(subjectId, { topics });
  }

  async updateTopicStats(
    subjectId: string, 
    topicId: string, 
    addedMinutes: number, 
    addedAttempted = 0, 
    addedCorrect = 0
  ): Promise<Subject> {
    const subject = await this.getById(subjectId);
    if (!subject) throw new Error(`Subject ${subjectId} not found`);

    const topics = (subject.topics || []).map(t => {
      if (t.id === topicId) {
        const attempted = (t.questionsAttempted || 0) + addedAttempted;
        const correct = (t.questionsCorrect || 0) + addedCorrect;
        return {
          ...t,
          studyMinutes: (t.studyMinutes || 0) + addedMinutes,
          questionsAttempted: attempted,
          questionsCorrect: correct,
          status: t.status === 'not_started' ? 'in_progress' : t.status,
        };
      }
      return t;
    });

    const totalMinutes = (subject.totalStudyMinutes || 0) + addedMinutes;
    const totalAttempted = (subject.questionsAttempted || 0) + addedAttempted;
    const totalCorrect = (subject.questionsCorrect || 0) + addedCorrect;
    const accuracyRate = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

    return this.update(subjectId, {
      topics,
      totalStudyMinutes: totalMinutes,
      questionsAttempted: totalAttempted,
      questionsCorrect: totalCorrect,
      accuracyRate,
    });
  }
}

export { LocalSubjectRepository as SubjectRepository };
