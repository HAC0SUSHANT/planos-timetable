import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { 
  Task, 
  Goal, 
  Subject, 
  DailyProgress, 
  Habit, 
  StudySession, 
  Note, 
  LearningFile, 
  LearningSource, 
  Reminder, 
  DailyReview, 
  UserSettings, 
  CreateTaskDTO, 
  UpdateTaskDTO, 
  CreateGoalDTO, 
  UpdateGoalDTO,
  GoalDecompositionPlan,
  AIMessage
} from '../types';
import { createServices } from '../services';
import type { ServiceContainer } from '../services';
import { getTodayDateString, INITIAL_SETTINGS } from '../data/initialData';

export type NavigationSection = 
  | 'today'
  | 'schedule'
  | 'goals'
  | 'habits'
  | 'study'
  | 'progress'
  | 'notes'
  | 'files'
  | 'ai'
  | 'settings';

interface AppContextType {
  currentView: NavigationSection;
  setCurrentView: (view: NavigationSection) => void;
  tasks: Task[];
  goals: Goal[];
  subjects: Subject[];
  habits: Habit[];
  studySessions: StudySession[];
  notes: Note[];
  files: LearningFile[];
  sources: LearningSource[];
  reminders: Reminder[];
  reviews: DailyReview[];
  settings: UserSettings;
  progress: DailyProgress | null;
  nextTask: Task | null;
  isLoading: boolean;
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: (open: boolean) => void;
  refreshData: () => Promise<void>;

  // Task actions
  createTask: (dto: CreateTaskDTO) => Promise<Task>;
  updateTask: (id: string, updates: UpdateTaskDTO) => Promise<Task>;
  completeTask: (id: string) => Promise<Task>;
  startTask: (id: string) => Promise<Task>;
  pauseTask: (id: string) => Promise<Task>;
  resumeTask: (id: string) => Promise<Task>;
  skipTask: (id: string) => Promise<Task>;
  cancelTask: (id: string) => Promise<Task>;
  rescheduleTask: (id: string, newDate: string, newStartTime?: string) => Promise<Task>;
  duplicateTask: (id: string) => Promise<Task>;
  deleteTask: (id: string) => Promise<boolean>;

  // Goal actions
  createGoal: (dto: CreateGoalDTO) => Promise<Goal>;
  updateGoal: (id: string, updates: UpdateGoalDTO) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<boolean>;
  toggleMilestone: (goalId: string, milestoneId: string) => Promise<Goal>;
  generateGoalDecomposition: (name: string, category?: string) => GoalDecompositionPlan;

  // Habit actions
  createHabit: (input: any) => Promise<Habit>;
  toggleHabitDate: (habitId: string, date?: string) => Promise<Habit>;
  deleteHabit: (habitId: string) => Promise<boolean>;

  // Study actions
  recordStudySession: (input: any) => Promise<StudySession>;
  createSubject: (name: string, code?: string, color?: string) => Promise<Subject>;
  addTopic: (subjectId: string, title: string) => Promise<Subject>;

  // Note actions
  createNote: (input: any) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<Note>;
  deleteNote: (id: string) => Promise<boolean>;

  // File & Source actions
  createFile: (file: Omit<LearningFile, 'id'>) => Promise<LearningFile>;
  deleteFile: (id: string) => Promise<boolean>;
  createSource: (source: Omit<LearningSource, 'id' | 'createdAt'>) => Promise<LearningSource>;
  deleteSource: (id: string) => Promise<boolean>;

  // Reminder actions
  createReminder: (reminder: any) => Promise<Reminder>;
  dismissReminder: (id: string) => Promise<Reminder>;
  snoozeReminder: (id: string, minutes: number) => Promise<Reminder>;
  deleteReminder: (id: string) => Promise<boolean>;

  // Review & Settings
  saveReview: (review: Omit<DailyReview, 'id' | 'createdAt'>) => Promise<DailyReview>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<UserSettings>;

  // AI execution
  processAIQuery: (query: string) => Promise<AIMessage>;

  services: ServiceContainer;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const services = useMemo(() => createServices(), []);
  
  const [currentView, setCurrentView] = useState<NavigationSection>('today');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<LearningFile[]>([]);
  const [sources, setSources] = useState<LearningSource[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reviews, setReviews] = useState<DailyReview[]>([]);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);

  const [progress, setProgress] = useState<DailyProgress | null>(null);
  const [nextTask, setNextTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);

  const refreshData = useCallback(async () => {
    try {
      const today = getTodayDateString();
      const [
        allTasks,
        allGoals,
        allSubjects,
        allHabits,
        allSessions,
        allNotes,
        allFiles,
        allSources,
        allReminders,
        allReviews,
        userSettings,
        dailyProgress,
        next
      ] = await Promise.all([
        services.taskService.getAllTasks(),
        services.goalService.getGoals(),
        services.studyService.getAllSubjects(),
        services.habitService.getAllHabits(),
        services.studyService.getAllSessions(),
        services.noteRepo.getAll(),
        services.fileRepo.getAllFiles(),
        services.fileRepo.getAllSources(),
        services.reminderService.getAllReminders(),
        services.reviewRepo.getAll(),
        services.settingsRepo.getSettings(),
        services.progressService.getDailyProgress(today),
        services.taskService.getNextTask(today),
      ]);

      setTasks(allTasks);
      setGoals(allGoals);
      setSubjects(allSubjects);
      setHabits(allHabits);
      setStudySessions(allSessions);
      setNotes(allNotes);
      setFiles(allFiles);
      setSources(allSources);
      setReminders(allReminders);
      setReviews(allReviews);
      setSettings(userSettings);
      setProgress(dailyProgress);
      setNextTask(next);
    } catch (err) {
      console.error('[AppContext] Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [services]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Tasks
  const createTask = async (dto: CreateTaskDTO): Promise<Task> => {
    const created = await services.taskService.createTask(dto);
    await refreshData();
    return created;
  };

  const updateTask = async (id: string, updates: UpdateTaskDTO): Promise<Task> => {
    const updated = await services.taskService.updateTask(id, updates);
    await refreshData();
    return updated;
  };

  const completeTask = async (id: string): Promise<Task> => {
    const completed = await services.taskService.completeTask(id);
    await refreshData();
    return completed;
  };

  const startTask = async (id: string): Promise<Task> => {
    const t = await services.taskService.startTask(id);
    await refreshData();
    return t;
  };

  const pauseTask = async (id: string): Promise<Task> => {
    const t = await services.taskService.pauseTask(id);
    await refreshData();
    return t;
  };

  const resumeTask = async (id: string): Promise<Task> => {
    const t = await services.taskService.resumeTask(id);
    await refreshData();
    return t;
  };

  const skipTask = async (id: string): Promise<Task> => {
    const t = await services.taskService.skipTask(id);
    await refreshData();
    return t;
  };

  const cancelTask = async (id: string): Promise<Task> => {
    const t = await services.taskService.cancelTask(id);
    await refreshData();
    return t;
  };

  const rescheduleTask = async (id: string, newDate: string, newStartTime?: string): Promise<Task> => {
    const rescheduled = await services.taskService.rescheduleTask(id, newDate, newStartTime);
    await refreshData();
    return rescheduled;
  };

  const duplicateTask = async (id: string): Promise<Task> => {
    const dup = await services.taskService.duplicateTask(id);
    await refreshData();
    return dup;
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    const result = await services.taskService.deleteTask(id);
    await refreshData();
    return result;
  };

  // Goals
  const createGoal = async (dto: CreateGoalDTO): Promise<Goal> => {
    const created = await services.goalService.createGoal(dto);
    await refreshData();
    return created;
  };

  const updateGoal = async (id: string, updates: UpdateGoalDTO): Promise<Goal> => {
    const updated = await services.goalService.updateGoal(id, updates);
    await refreshData();
    return updated;
  };

  const deleteGoal = async (id: string): Promise<boolean> => {
    const result = await services.goalService.deleteGoal(id);
    await refreshData();
    return result;
  };

  const toggleMilestone = async (goalId: string, milestoneId: string): Promise<Goal> => {
    const g = await services.goalService.toggleMilestone(goalId, milestoneId);
    await refreshData();
    return g;
  };

  const generateGoalDecomposition = (name: string, category?: string): GoalDecompositionPlan => {
    return services.goalService.generateDecompositionPlan(name, category);
  };

  // Habits
  const createHabit = async (input: any): Promise<Habit> => {
    const h = await services.habitService.createHabit(input);
    await refreshData();
    return h;
  };

  const toggleHabitDate = async (habitId: string, date?: string): Promise<Habit> => {
    const h = await services.habitService.toggleHabitDate(habitId, date);
    await refreshData();
    return h;
  };

  const deleteHabit = async (habitId: string): Promise<boolean> => {
    const res = await services.habitService.deleteHabit(habitId);
    await refreshData();
    return res;
  };

  // Study
  const recordStudySession = async (input: any): Promise<StudySession> => {
    const ses = await services.studyService.recordSession(input);
    // If associated with task, also update task actual duration
    if (input.taskId && input.actualDuration) {
      await services.taskService.updateTask(input.taskId, {
        actualDuration: input.actualDuration,
        status: 'completed',
      });
    }
    await refreshData();
    return ses;
  };

  const createSubject = async (name: string, code?: string, color?: string): Promise<Subject> => {
    const s = await services.studyService.createSubject(name, code, color);
    await refreshData();
    return s;
  };

  const addTopic = async (subjectId: string, title: string): Promise<Subject> => {
    const s = await services.studyService.addTopicToSubject(subjectId, title);
    await refreshData();
    return s;
  };

  // Notes
  const createNote = async (input: any): Promise<Note> => {
    const n = await services.noteRepo.create(input);
    await refreshData();
    return n;
  };

  const updateNote = async (id: string, updates: Partial<Note>): Promise<Note> => {
    const n = await services.noteRepo.update(id, updates);
    await refreshData();
    return n;
  };

  const deleteNote = async (id: string): Promise<boolean> => {
    const res = await services.noteRepo.delete(id);
    await refreshData();
    return res;
  };

  // Files & Sources
  const createFile = async (file: Omit<LearningFile, 'id'>): Promise<LearningFile> => {
    const f = await services.fileRepo.createFile(file);
    await refreshData();
    return f;
  };

  const deleteFile = async (id: string): Promise<boolean> => {
    const res = await services.fileRepo.deleteFile(id);
    await refreshData();
    return res;
  };

  const createSource = async (source: Omit<LearningSource, 'id' | 'createdAt'>): Promise<LearningSource> => {
    const s = await services.fileRepo.createSource(source);
    await refreshData();
    return s;
  };

  const deleteSource = async (id: string): Promise<boolean> => {
    const res = await services.fileRepo.deleteSource(id);
    await refreshData();
    return res;
  };

  // Reminders
  const createReminder = async (reminder: any): Promise<Reminder> => {
    const r = await services.reminderService.createReminder(reminder);
    await refreshData();
    return r;
  };

  const dismissReminder = async (id: string): Promise<Reminder> => {
    const r = await services.reminderService.dismissReminder(id);
    await refreshData();
    return r;
  };

  const snoozeReminder = async (id: string, minutes: number): Promise<Reminder> => {
    const r = await services.reminderService.snoozeReminder(id, minutes);
    await refreshData();
    return r;
  };

  const deleteReminder = async (id: string): Promise<boolean> => {
    const res = await services.reminderService.deleteReminder(id);
    await refreshData();
    return res;
  };

  // Reviews & Settings
  const saveReview = async (review: Omit<DailyReview, 'id' | 'createdAt'>): Promise<DailyReview> => {
    const r = await services.reviewRepo.saveReview(review);
    await refreshData();
    return r;
  };

  const updateSettings = async (updates: Partial<UserSettings>): Promise<UserSettings> => {
    const s = await services.settingsRepo.updateSettings(updates);
    setSettings(s);
    return s;
  };

  const processAIQuery = async (query: string): Promise<AIMessage> => {
    const msg = await services.aiAgentService.processUserQuery(query);
    await refreshData();
    return msg;
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        tasks,
        goals,
        subjects,
        habits,
        studySessions,
        notes,
        files,
        sources,
        reminders,
        reviews,
        settings,
        progress,
        nextTask,
        isLoading,
        isQuickAddOpen,
        setIsQuickAddOpen,
        refreshData,
        createTask,
        updateTask,
        completeTask,
        startTask,
        pauseTask,
        resumeTask,
        skipTask,
        cancelTask,
        rescheduleTask,
        duplicateTask,
        deleteTask,
        createGoal,
        updateGoal,
        deleteGoal,
        toggleMilestone,
        generateGoalDecomposition,
        createHabit,
        toggleHabitDate,
        deleteHabit,
        recordStudySession,
        createSubject,
        addTopic,
        createNote,
        updateNote,
        deleteNote,
        createFile,
        deleteFile,
        createSource,
        deleteSource,
        createReminder,
        dismissReminder,
        snoozeReminder,
        deleteReminder,
        saveReview,
        updateSettings,
        processAIQuery,
        services,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
