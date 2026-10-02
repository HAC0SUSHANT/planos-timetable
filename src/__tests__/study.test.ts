import { describe, it, expect, beforeEach } from 'vitest';
import { StudyRepository } from '../data/study.repository';
import { SubjectRepository } from '../data/subject.repository';
import { StudyService } from '../services/study.service';

describe('Study Tracking & Accuracy Analytics', () => {
  let studyRepo: StudyRepository;
  let subjectRepo: SubjectRepository;
  let studyService: StudyService;

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    studyRepo = new StudyRepository();
    subjectRepo = new SubjectRepository();
    studyService = new StudyService(studyRepo, subjectRepo);
  });

  it('records study sessions and computes actual duration and accuracy mathematically', async () => {
    const subject = await subjectRepo.create({
      name: 'Physics',
      color: '#3B82F6',
    });

    const topic = await subjectRepo.addTopic(subject.id, {
      title: 'Electrostatics',
      estimatedMinutes: 60,
      status: 'in_progress',
      order: 1,
    });

    expect(topic.questionsAttempted).toBe(0);

    // Record a 52-minute session with 30 questions attempted, 24 correct
    const session = await studyService.recordSession({
      subjectId: subject.id,
      topicId: topic.id,
      startTime: '19:00',
      endTime: '19:52',
      plannedDuration: 60,
      actualDuration: 52,
      questionsAttempted: 30,
      questionsCorrect: 24,
      difficulty: 'medium',
      notes: 'Gauss law is clear but calculations are slow.',
    });

    expect(session.id).toBeDefined();
    expect(session.actualDuration).toBe(52);
    expect(session.plannedDuration).toBe(60);
    expect(session.accuracy).toBe(80); // 24 / 30 = 80%

    // Verify subject level metrics were updated
    const updatedSubject = await subjectRepo.getById(subject.id);
    expect(updatedSubject?.totalStudyMinutes).toBe(52);
    expect(updatedSubject?.questionsAttempted).toBe(30);
    expect(updatedSubject?.questionsCorrect).toBe(24);
    expect(updatedSubject?.accuracyRate).toBe(80);
  });
});
