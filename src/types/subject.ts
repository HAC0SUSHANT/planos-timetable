export type TopicStatus = 'not_started' | 'in_progress' | 'completed' | 'revision';

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  status: TopicStatus;
  order: number;
  studyMinutes?: number;
  questionsAttempted?: number;
  questionsCorrect?: number;
  accuracyRate?: number;
  estimatedMinutes?: number;
  notes?: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  color: string;
  icon?: string;
  topics?: Topic[];
  totalStudyMinutes?: number;
  questionsAttempted?: number;
  questionsCorrect?: number;
  accuracyRate?: number; // 0 to 100
}
