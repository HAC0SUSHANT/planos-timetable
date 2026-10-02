export type TaskStatus = 'pending' | 'in_progress' | 'paused' | 'completed' | 'cancelled' | 'skipped';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type RecurrenceFrequency = 'none' | 'daily' | 'weekdays' | 'weekly' | 'custom_days' | 'interval';

export type RecurrenceEndCondition = 'forever' | 'until_date' | 'count';

export interface TaskRecurrence {
  frequency: RecurrenceFrequency;
  interval?: number; // e.g. every 2 days
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday...
  endCondition: RecurrenceEndCondition;
  endDate?: string; // YYYY-MM-DD
  maxOccurrences?: number;
  occurrenceCount?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm (24-hour format)
  endTime?: string; // HH:mm
  duration: number; // in minutes (planned)
  actualDuration?: number; // in minutes (actual time spent)
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
  subjectId?: string;
  goalId?: string;
  milestoneId?: string;
  notes?: string;
  isRecurring?: boolean;
  recurrence?: TaskRecurrence;
  parentTaskId?: string; // if created from a recurring parent
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  completedAt?: string; // ISO string
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  priority?: TaskPriority;
  category?: string;
  subjectId?: string;
  goalId?: string;
  milestoneId?: string;
  notes?: string;
  isRecurring?: boolean;
  recurrence?: TaskRecurrence;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  actualDuration?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  subjectId?: string;
  goalId?: string;
  milestoneId?: string;
  notes?: string;
  completedAt?: string;
  isRecurring?: boolean;
  recurrence?: TaskRecurrence;
}

export interface TaskFilter {
  date?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  subjectId?: string;
  goalId?: string;
  milestoneId?: string;
}
