import type { IStudyRepository } from '../data/study.repository';
import type { LocalSubjectRepository } from '../data/subject.repository';
import type { StudySession, StudyDifficulty, Subject } from '../types';
import { getTodayDateString } from '../data/initialData';

export class StudyService {
  private readonly studyRepo: IStudyRepository;
  private readonly subjectRepo: LocalSubjectRepository;

  constructor(studyRepo: IStudyRepository, subjectRepo: LocalSubjectRepository) {
    this.studyRepo = studyRepo;
    this.subjectRepo = subjectRepo;
  }

  async getAllSessions(): Promise<StudySession[]> {
    return this.studyRepo.getAllSessions();
  }

  async getSessionsBySubject(subjectId: string): Promise<StudySession[]> {
    return this.studyRepo.getBySubjectId(subjectId);
  }

  async getSessionsByDate(date?: string): Promise<StudySession[]> {
    const targetDate = date || getTodayDateString();
    return this.studyRepo.getByDate(targetDate);
  }

  async recordSession(input: {
    subjectId: string;
    topicId?: string;
    taskId?: string;
    startTime: string;
    endTime: string;
    plannedDuration: number;
    actualDuration: number;
    questionsAttempted?: number;
    questionsCorrect?: number;
    difficulty?: StudyDifficulty;
    sourceTitle?: string;
    notes?: string;
    interruptions?: number;
  }): Promise<StudySession> {
    const attempted = input.questionsAttempted || 0;
    const correct = input.questionsCorrect || 0;
    const accuracyRate = attempted > 0 ? Math.round((correct / attempted) * 100) : undefined;

    const session = await this.studyRepo.createSession({
      ...input,
      date: getTodayDateString(),
      accuracyRate,
      accuracy: accuracyRate,
    });

    // Update topic and subject statistics
    if (input.subjectId && input.topicId) {
      await this.subjectRepo.updateTopicStats(
        input.subjectId,
        input.topicId,
        input.actualDuration,
        attempted,
        correct
      );
    }

    return session;
  }

  async getAllSubjects(): Promise<Subject[]> {
    return this.subjectRepo.getAll();
  }

  async createSubject(name: string, code?: string, color?: string): Promise<Subject> {
    return this.subjectRepo.create({
      name: name.trim(),
      code: code?.trim(),
      color: color || '#3B82F6',
    });
  }

  async addTopicToSubject(subjectId: string, title: string): Promise<Subject> {
    const subject = await this.subjectRepo.getById(subjectId);
    const order = (subject?.topics?.length || 0) + 1;
    return this.subjectRepo.addTopic(subjectId, {
      title: title.trim(),
      status: 'not_started',
      order,
      studyMinutes: 0,
      questionsAttempted: 0,
      questionsCorrect: 0,
    });
  }
}
