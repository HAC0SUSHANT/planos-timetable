export interface DailyProgress {
  date: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  cancelledTasks: number;
  skippedTasks: number;
  completionRate: number; // 0 to 100 percentage
  totalMinutesScheduled: number;
  totalMinutesCompleted: number; // actual time spent
  hasEnoughData: boolean;
}

export interface SubjectStudyTime {
  subjectId: string;
  subjectName: string;
  color: string;
  minutes: number;
}

export interface WeeklyProgressMetrics {
  weekStartDate: string;
  weekEndDate: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  totalStudyMinutes: number;
  habitConsistency: number; // 0 to 100
  activeGoalsCount: number;
  subjectBreakdown: SubjectStudyTime[];
}

export interface MonthlyProgressMetrics {
  month: string; // YYYY-MM
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  totalStudyMinutes: number;
  habitConsistency: number;
}
