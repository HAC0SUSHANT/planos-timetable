export type HabitFrequency = 'daily' | 'weekdays' | 'weekly' | 'custom';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: HabitFrequency;
  targetDays?: number[]; // 0=Sun, 1=Mon...
  preferredTime?: string; // HH:mm
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  goalId?: string;
  reminderTime?: string;
  notes?: string;
  color?: string;
  completionHistory: string[]; // List of YYYY-MM-DD date strings
  currentStreak: number;
  streak?: number;
  bestStreak: number;
  consistencyPercentage: number; // e.g. 86%
  consistencyRate?: number;
  createdAt: string;
}

export type StudyDifficulty = 'easy' | 'medium' | 'hard';

export interface StudySession {
  id: string;
  subjectId: string;
  topicId?: string;
  taskId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  plannedDuration: number; // minutes
  actualDuration: number; // minutes
  questionsAttempted?: number;
  questionsCorrect?: number;
  accuracyRate?: number; // 0 to 100
  accuracy?: number; // 0 to 100
  difficulty?: StudyDifficulty;
  sourceTitle?: string;
  notes?: string;
  interruptions?: number;
  createdAt: string;
}

export type TimerMode = 'countdown' | 'stopwatch' | 'pomodoro';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';
export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak';

export interface FocusTimerState {
  mode: TimerMode;
  status: TimerStatus;
  taskId?: string;
  subjectId?: string;
  taskTitle?: string;
  plannedSeconds: number;
  remainingSeconds: number;
  elapsedSeconds: number;
  pomodoroPhase: PomodoroPhase;
  pomodoroRound: number;
  startedAt?: number; // timestamp
  lastTickAt?: number; // timestamp for accurate delta background tracking
}

export type NoteEntityType = 'task' | 'goal' | 'habit' | 'subject' | 'topic' | 'session' | 'day' | 'general';

export interface NoteRelatedEntity {
  type: NoteEntityType;
  id: string;
  name?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  relatedEntity?: NoteRelatedEntity;
  createdAt: string;
  updatedAt: string;
}

export interface LearningFile {
  id: string;
  name: string;
  mimeType: string;
  type?: string;
  size: number;
  uploadDate: string;
  uploadedAt?: string;
  relatedSubjectId?: string;
  relatedGoalId?: string;
  relatedTopicId?: string;
  tags: string[];
  dataUrl?: string; // base64 or object URL for client preview/download
}

export type LearningSourceType = 'youtube' | 'website' | 'course' | 'book' | 'pdf' | 'documentation' | 'article';

export interface LearningSource {
  id: string;
  title: string;
  url: string;
  type: LearningSourceType;
  description?: string;
  subjectId?: string;
  topicId?: string;
  tags: string[];
  createdAt: string;
}

export type ReminderType = 'before_task' | 'at_start' | 'before_deadline' | 'habit' | 'goal_deadline' | 'custom';

export interface Reminder {
  id: string;
  title: string;
  message?: string;
  triggerAt: string; // ISO string or YYYY-MM-DDTHH:mm
  type: ReminderType;
  taskId?: string;
  relatedTaskId?: string;
  habitId?: string;
  goalId?: string;
  targetDate?: string;
  targetTime?: string;
  minutesBefore?: number;
  isTriggered: boolean;
  isDismissed: boolean;
  dismissed?: boolean;
  snoozeUntil?: string;
  createdAt: string;
}

export interface DailyReview {
  id: string;
  date: string; // YYYY-MM-DD
  plannedMinutes: number;
  actualMinutes: number;
  tasksCompleted: number;
  tasksMissed: number;
  tasksRescheduled: number;
  habitsCompleted: number;
  studyMinutes: number;
  whatWentWell: string;
  whatToChangeTomorrow: string;
  whatToChange?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  energyRating?: number;
  createdAt: string;
}

export type AIAutomationLevel = 'manual' | 'assisted' | 'automatic';

export interface UserSettings {
  userName: string;
  timezone: string;
  themePreference: 'light' | 'dark' | 'system';
  theme?: 'light' | 'dark';
  startOfDay: string; // HH:mm e.g. "07:00"
  dayStartHour?: number;
  sleepHours: number | { start: string; end: string }; // e.g. 8 or { start: '23:00', end: '07:00' }
  availableHours: number; // e.g. 6 hours of discretionary/study time
  defaultTaskDuration: number; // minutes e.g. 45
  defaultBreakDuration: number; // minutes e.g. 10
  quietHoursStart: string; // e.g. "22:00"
  quietHoursEnd: string; // e.g. "07:00"
  quietHours?: { start?: string; end?: string; enabled?: boolean };
  reminderPreferences?: { taskReminderMinutesBefore?: number; habitReminders?: boolean; soundEnabled?: boolean };
  weekStartDay: 0 | 1 | 'monday' | 'sunday'; // 0=Sunday, 1=Monday
  timeFormat: '12h' | '24h';
  aiAutomationLevel: AIAutomationLevel;
  notificationsEnabled: boolean;
  apiKey?: string;
  apiEndpoint?: string;
  aiModel?: string;
}

export interface AIActionCard {
  id: string;
  type: 'schedule_task' | 'reschedule' | 'study_recommendation' | 'goal_breakdown';
  title: string;
  subtitle?: string;
  duration?: number;
  time?: string;
  date?: string;
  applied?: boolean;
  payload: Record<string, unknown>;
}

export interface AIConfirmationDiff {
  label: string;
  oldVal: string;
  newVal: string;
}

export interface AIConfirmationRequired {
  actionType: string;
  description: string;
  impactLevel: 'low' | 'medium' | 'high';
  diff: AIConfirmationDiff[];
  payload: Record<string, unknown>;
}

export interface AIAgentCapability {
  name: string;
  signature: string;
  description: string;
  isImplementedInFoundation: boolean;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actionCards?: AIActionCard[];
  confirmationRequired?: AIConfirmationRequired;
}

export interface AIProgressInsight {
  id: string;
  category: 'study' | 'completion' | 'habit' | 'time_drift' | 'topic';
  title: string;
  observation: string;
  recommendation?: string;
  dataMetric?: string;
}
