export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  order: number;
  totalTasks?: number;
  completedTasks?: number;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  targetDate: string; // YYYY-MM-DD
  progress: number; // 0 to 100 derived from milestones/tasks
  status: GoalStatus;
  priority?: GoalPriority;
  category?: string;
  subjectId?: string;
  milestones?: Milestone[];
  notes?: string;
  resources?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalDTO {
  name: string;
  description: string;
  startDate: string;
  targetDate: string;
  progress?: number;
  status?: GoalStatus;
  priority?: GoalPriority;
  category?: string;
  subjectId?: string;
  milestones?: Array<{ title: string; description?: string; dueDate?: string }>;
  notes?: string;
}

export interface UpdateGoalDTO {
  name?: string;
  description?: string;
  startDate?: string;
  targetDate?: string;
  progress?: number;
  status?: GoalStatus;
  priority?: GoalPriority;
  category?: string;
  subjectId?: string;
  milestones?: Milestone[];
  notes?: string;
  resources?: string[];
}

export interface GoalDecompositionPlan {
  goalName: string;
  description: string;
  suggestedMilestones: Array<{
    title: string;
    description: string;
    suggestedTasks: Array<{
      title: string;
      estimatedMinutes: number;
      priority: 'low' | 'medium' | 'high';
    }>;
  }>;
}
