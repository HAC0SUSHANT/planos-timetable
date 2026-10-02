import type { TaskService } from './task.service';
import type { GoalService } from './goal.service';
import type { ProgressService } from './progress.service';
import type { HabitService } from './habit.service';
import type { StudyService } from './study.service';
import type { INoteRepository } from '../data/note.repository';
import type { IFileRepository } from '../data/file.repository';
import type { ISettingsRepository } from '../data/settings.repository';
import type { 
  Task, 
  CreateTaskDTO, 
  UpdateTaskDTO, 
  Goal, 
  DailyProgress, 
  Habit, 
  StudySession, 
  Note, 
  LearningFile, 
  LearningSource, 
  AIAgentCapability, 
  AIMessage, 
  AIProgressInsight 
} from '../types';
import { NLPParserService } from './nlpParser.service';
import { SchedulingEngineService } from './schedulingEngine.service';
import { LocalHeuristicAIProvider, ExternalLLMProvider } from './externalProviders';

export class AIAgentService {
  private readonly taskService: TaskService;
  private readonly goalService: GoalService;
  private readonly progressService: ProgressService;
  private readonly habitService: HabitService;
  private readonly studyService: StudyService;
  private readonly noteRepo: INoteRepository;
  private readonly fileRepo: IFileRepository;
  private readonly settingsRepo: ISettingsRepository;

  constructor(
    taskService: TaskService,
    goalService: GoalService,
    progressService: ProgressService,
    habitService: HabitService,
    studyService: StudyService,
    noteRepo: INoteRepository,
    fileRepo: IFileRepository,
    settingsRepo: ISettingsRepository
  ) {
    this.taskService = taskService;
    this.goalService = goalService;
    this.progressService = progressService;
    this.habitService = habitService;
    this.studyService = studyService;
    this.noteRepo = noteRepo;
    this.fileRepo = fileRepo;
    this.settingsRepo = settingsRepo;
  }

  // =========================================================================
  // READ ACTIONS (Safe, executed immediately)
  // =========================================================================

  async get_today_tasks(): Promise<Task[]> {
    return this.taskService.getTodayTasks();
  }

  async get_schedule(): Promise<Task[]> {
    return this.taskService.getAllTasks();
  }

  async get_goals(): Promise<Goal[]> {
    return this.goalService.getGoals();
  }

  async get_goal_progress(goalId?: string): Promise<Goal[] | Goal | null> {
    if (goalId) return this.goalService.getGoalById(goalId);
    return this.goalService.getActiveGoals();
  }

  async get_habits(): Promise<Habit[]> {
    return this.habitService.getAllHabits();
  }

  async get_study_history(): Promise<StudySession[]> {
    return this.studyService.getAllSessions();
  }

  async get_subject_progress(): Promise<any[]> {
    return this.studyService.getAllSubjects();
  }

  async search_notes(query: string): Promise<Note[]> {
    const all = await this.noteRepo.getAll();
    const q = query.toLowerCase();
    return all.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }

  async search_files(query: string): Promise<LearningFile[]> {
    const all = await this.fileRepo.getAllFiles();
    const q = query.toLowerCase();
    return all.filter(f => f.name.toLowerCase().includes(q) || f.tags.some(t => t.toLowerCase().includes(q)));
  }

  async search_sources(query: string): Promise<LearningSource[]> {
    const all = await this.fileRepo.getAllSources();
    const q = query.toLowerCase();
    return all.filter(s => s.title.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q)));
  }

  async get_progress(): Promise<DailyProgress> {
    return this.progressService.getDailyProgress();
  }

  // =========================================================================
  // WRITE ACTIONS (Controlled, auditable)
  // =========================================================================

  async create_task(input: CreateTaskDTO): Promise<Task> {
    return this.taskService.createTask(input);
  }

  async update_task(id: string, updates: UpdateTaskDTO): Promise<Task> {
    return this.taskService.updateTask(id, updates);
  }

  async complete_task(id: string): Promise<Task> {
    return this.taskService.completeTask(id);
  }

  async skip_task(id: string): Promise<Task> {
    return this.taskService.skipTask(id);
  }

  async reschedule_task(id: string, newDate: string, newStartTime?: string): Promise<Task> {
    return this.taskService.rescheduleTask(id, newDate, newStartTime);
  }

  async delete_task(id: string): Promise<boolean> {
    return this.taskService.deleteTask(id);
  }

  async create_goal(name: string, description: string, targetDate: string, category?: string): Promise<Goal> {
    return this.goalService.createGoal({
      name,
      description,
      startDate: new Date().toISOString().split('T')[0],
      targetDate,
      category,
    });
  }

  async create_habit(name: string, frequency: any = 'daily', preferredTime?: string): Promise<Habit> {
    return this.habitService.createHabit({
      name,
      frequency,
      preferredTime,
    });
  }

  async complete_habit(habitId: string, date?: string): Promise<Habit> {
    return this.habitService.toggleHabitDate(habitId, date);
  }

  async create_note(title: string, content: string, tags: string[] = []): Promise<Note> {
    return this.noteRepo.create({
      title,
      content,
      tags,
    });
  }

  // =========================================================================
  // HIGH-LEVEL WORKFLOWS: DAILY PLANNER & PROGRESS ANALYSIS
  // =========================================================================

  /**
   * AI Daily Planner: Generates a prioritized execution plan matching available hours
   */
  async generateDailyPlan(availableHoursOverride?: number): Promise<AIMessage> {
    const settings = await this.settingsRepo.getSettings();
    const effectiveHours = availableHoursOverride ?? settings.availableHours ?? 5;
    const tasks = await this.get_today_tasks();
    const goals = await this.get_goals();
    const activeGoals = goals.filter(g => g.status === 'active');
    const habits = await this.habitService.getHabitsDueToday();

    const audit = SchedulingEngineService.auditWorkload(
      tasks,
      { ...settings, availableHours: effectiveHours },
      new Date().toISOString().split('T')[0]
    );

    const actionCards: any[] = [];
    const reasons: string[] = [];
    const maxCapacity = Math.round(effectiveHours * 60);
    let totalScheduledMinutes = 0;

    // Prioritized study tasks
    for (const t of audit.recommendedScheduleToday) {
      if (totalScheduledMinutes + t.duration <= maxCapacity) {
        actionCards.push({
          id: `card-${t.id}`,
          type: 'schedule_task',
          title: t.title,
          subtitle: `${t.category || 'Focus'} • Priority: ${t.priority}`,
          duration: t.duration,
          time: t.startTime,
          date: t.date,
          payload: { taskId: t.id },
        });
        reasons.push(`• **${t.title}** (${t.duration}m): Priority ${t.priority}`);
        totalScheduledMinutes += t.duration;
      }
    }

    // Include habit check if capacity allows
    for (const h of habits.slice(0, 2)) {
      if (totalScheduledMinutes + 30 <= maxCapacity) {
        actionCards.push({
          id: `card-h-${h.id}`,
          type: 'schedule_task',
          title: `Habit: ${h.name}`,
          subtitle: `Streak: ${h.streak ?? h.currentStreak ?? 0} days`,
          duration: 30,
          time: h.preferredTime,
          payload: { habitId: h.id },
        });
        totalScheduledMinutes += 30;
      }
    }

    let summaryText = `Based on your target of **${effectiveHours} available hours** today (${activeGoals.length} active goals tracked), here is your prioritized execution plan:\n\n` +
      reasons.join('\n');

    if (audit.isOverloaded) {
      summaryText += `\n\n⚠️ **Workload Warning:** You have ${audit.totalPlannedMinutes}m of commitments. We recommend postponing ${audit.recommendedPostponedTasks.length} non-critical tasks to tomorrow.`;
    }

    return {
      id: `plan-${Date.now()}`,
      role: 'assistant',
      content: summaryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionCards,
    };
  }

  /**
   * Synchronous progress analyzer for views and dashboards
   */
  analyzeProgress(tasks: Task[], studySessions: StudySession[], habits: Habit[], goals: Goal[]): AIProgressInsight[] {
    const insights: AIProgressInsight[] = [];
    let totalPlannedDiff = 0;
    let countedSessions = 0;
    for (const s of studySessions) {
      if (s.plannedDuration && s.actualDuration) {
        totalPlannedDiff += (s.actualDuration - s.plannedDuration);
        countedSessions++;
      }
    }

    if (countedSessions >= 2) {
      const avgDiff = Math.round(totalPlannedDiff / countedSessions);
      if (avgDiff > 10) {
        insights.push({
          id: 'ins-time-1',
          category: 'time_drift',
          title: 'Study Sessions Exceeding Planned Duration',
          observation: `Across ${countedSessions} recent study sessions, you averaged ${avgDiff} minutes longer than planned.`,
          recommendation: `Consider scheduling ${avgDiff} minutes more for difficult subjects to eliminate time overrun pressure.`,
          dataMetric: `+${avgDiff}m average drift`,
        });
      }
    }

    const lowHabit = habits.find(h => (h.consistencyRate ?? h.consistencyPercentage ?? 100) < 70);
    if (lowHabit) {
      insights.push({
        id: `ins-hab-${lowHabit.id}`,
        category: 'habit',
        title: `Habit Consistency: ${lowHabit.name}`,
        observation: `Consistency is currently ${lowHabit.consistencyRate ?? lowHabit.consistencyPercentage}%.`,
        recommendation: `Try anchoring this habit immediately after a fixed daily routine.`,
        dataMetric: `${lowHabit.consistencyRate ?? lowHabit.consistencyPercentage}% consistency`,
      });
    }

    const activeGoals = goals.filter(g => g.status === 'active');
    if (activeGoals.length > 0) {
      insights.push({
        id: 'ins-goals-1',
        category: 'completion',
        title: 'Active Goal Alignment',
        observation: `You have ${activeGoals.length} active goals in flight. Overall progress is pacing reliably.`,
        recommendation: 'Focus on advancing current milestone tasks before opening new subjects.',
        dataMetric: `${activeGoals.length} active goals`,
      });
    }

    const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
    if (tasks.length >= 3) {
      const rate = Math.round((completedTasksCount / tasks.length) * 100);
      if (rate < 70) {
        insights.push({
          id: 'ins-tasks-rate',
          category: 'completion',
          title: 'Daily Task Completion Ratio',
          observation: `You have completed ${completedTasksCount} of ${tasks.length} total tasks (${rate}% completion rate).`,
          recommendation: 'Consider reducing daily tasks to prevent overloading and preserve momentum.',
          dataMetric: `${rate}% completion`,
        });
      }
    }

    if (insights.length === 0) {
      insights.push({
        id: 'ins-default',
        category: 'completion',
        title: 'Solid Execution Consistency',
        observation: 'Your planned vs actual metrics show steady discipline and balanced execution.',
        recommendation: 'Maintain your current rhythm and complete daily review reflections.',
        dataMetric: 'Balanced',
      });
    }

    return insights;
  }

  /**
   * Progress Analysis: Derives data-grounded insights from actual historical study records
   */
  async analyzeProgressData(): Promise<AIProgressInsight[]> {
    const sessions = await this.studyService.getAllSessions();
    const tasks = await this.taskService.getAllTasks();
    const habits = await this.habitService.getAllHabits();
    const subjects = await this.studyService.getAllSubjects();

    const insights: AIProgressInsight[] = [];

    // 1. Time Drift Analysis (Planned vs Actual duration)
    let totalPlannedDiff = 0;
    let countedSessions = 0;
    for (const s of sessions) {
      if (s.plannedDuration && s.actualDuration) {
        totalPlannedDiff += (s.actualDuration - s.plannedDuration);
        countedSessions++;
      }
    }

    if (countedSessions >= 2) {
      const avgDiff = Math.round(totalPlannedDiff / countedSessions);
      if (avgDiff > 10) {
        insights.push({
          id: 'ins-time-1',
          category: 'time_drift',
          title: 'Study Sessions Exceeding Planned Duration',
          observation: `Across ${countedSessions} recent study sessions, you averaged ${avgDiff} minutes longer than planned.`,
          recommendation: `Consider scheduling ${avgDiff} minutes more for difficult subjects to eliminate time overrun pressure.`,
          dataMetric: `+${avgDiff}m average drift`,
        });
      }
    }

    // 2. Accuracy & Practice Analysis
    for (const sub of subjects) {
      if (sub.accuracyRate && sub.accuracyRate > 0) {
        if (sub.accuracyRate < 75) {
          insights.push({
            id: `ins-acc-${sub.id}`,
            category: 'topic',
            title: `${sub.name} Practice Accuracy Focus`,
            observation: `Current problem-solving accuracy in ${sub.name} is ${sub.accuracyRate}% across ${sub.questionsAttempted || 0} questions attempted.`,
            recommendation: `Schedule revision on fundamental concept sheets before tackling further timed drills.`,
            dataMetric: `${sub.accuracyRate}% accuracy`,
          });
        }
      }
    }

    // 3. Habit Consistency Insight
    const lowConsistencyHabit = habits.find(h => h.consistencyPercentage < 60 && h.completionHistory.length >= 5);
    if (lowConsistencyHabit) {
      insights.push({
        id: `ins-hab-${lowConsistencyHabit.id}`,
        category: 'habit',
        title: `Habit Cadence: ${lowConsistencyHabit.name}`,
        observation: `Consistency over the past 30 days is ${lowConsistencyHabit.consistencyPercentage}%.`,
        recommendation: `Try anchoring this habit to a fixed anchor block (e.g. immediately after morning coffee or before evening review).`,
        dataMetric: `${lowConsistencyHabit.consistencyPercentage}% consistency`,
      });
    }

    // 4. Overall Task Completion Cadence
    const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
    if (tasks.length >= 3) {
      const rate = Math.round((completedTasksCount / tasks.length) * 100);
      if (rate < 70) {
        insights.push({
          id: 'ins-tasks-rate',
          category: 'completion',
          title: 'Daily Task Completion Ratio',
          observation: `You have completed ${completedTasksCount} of ${tasks.length} total tasks (${rate}% completion rate).`,
          recommendation: 'Consider reducing daily tasks to prevent overloading and preserve momentum.',
          dataMetric: `${rate}% completion`,
        });
      }
    }

    // If no negative drift, add positive baseline insight
    if (insights.length === 0) {
      insights.push({
        id: 'ins-good',
        category: 'completion',
        title: 'Solid Execution Consistency',
        observation: `Your planned-to-actual completion ratio is stable, and study sessions match your target schedule closely.`,
        recommendation: `Maintain your current rhythm and focus on high-priority goal milestones.`,
        dataMetric: 'High alignment',
      });
    }

    return insights;
  }

  /**
   * Conversational query handler supporting tool execution and confirmation flows
   */
  async processUserQuery(query: string): Promise<AIMessage> {
    const raw = query.trim().toLowerCase();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Natural language task creation detection
    if (/^(study|workout|practice|solve|read|finish|prepare|review|revise)\b/i.test(query) && /tomorrow|at\s+\d+|for\s+\d+|every/i.test(query)) {
      const parsed = NLPParserService.parseTaskString(query);
      if (parsed.isValid) {
        return {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `I parsed a task from your request: **${parsed.dto.title}** on **${parsed.dto.date}** for **${parsed.dto.duration} minutes**.`,
          timestamp,
          confirmationRequired: {
            actionType: 'create_task',
            description: `Create task "${parsed.dto.title}"?`,
            impactLevel: 'low',
            diff: [
              { label: 'Task Title', oldVal: '—', newVal: parsed.dto.title },
              { label: 'Date', oldVal: '—', newVal: parsed.dto.date },
              { label: 'Time', oldVal: '—', newVal: parsed.dto.startTime || 'Flexible' },
              { label: 'Duration', oldVal: '—', newVal: `${parsed.dto.duration} min` },
              { label: 'Subject', oldVal: '—', newVal: parsed.dto.category || 'General' },
            ],
            payload: parsed.dto as any,
          },
        };
      }
    }

    // 2. "What should I do right now?" / "What is next?"
    if (raw.includes('what should i do') || raw.includes('what to do next') || raw.includes('next action')) {
      const next = await this.taskService.getNextTask();
      if (!next) {
        return {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: "You have no pending tasks scheduled right now! Your queue is clear. Would you like me to generate a study plan or break down a goal?",
          timestamp,
        };
      }

      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Your highest priority next action right now is **${next.title}** (${next.duration} min).`,
        timestamp,
        actionCards: [
          {
            id: `act-${next.id}`,
            type: 'schedule_task',
            title: next.title,
            subtitle: `${next.category || 'Focus'} • Scheduled: ${next.startTime || 'Now'}`,
            duration: next.duration,
            time: next.startTime,
            payload: { taskId: next.id },
          },
        ],
      };
    }

    // 3. "Plan my day" / "I have X hours"
    if (raw.includes('plan my day') || raw.includes('hours today') || raw.includes('plan today')) {
      const hoursMatch = raw.match(/(\d+(?:\.\d+)?)\s*hours?/i);
      const hours = hoursMatch ? parseFloat(hoursMatch[1]) : undefined;
      return this.generateDailyPlan(hours);
    }

    // 4. "Move unfinished tasks to tomorrow" / Reschedule
    if (raw.includes('move') && (raw.includes('tomorrow') || raw.includes('unfinished'))) {
      const todayTasks = await this.get_today_tasks();
      const unfinished = todayTasks.filter(t => t.status === 'pending' || t.status === 'paused');

      if (unfinished.length === 0) {
        return {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: "You don't have any unfinished tasks to move for today! Everything is completed or cancelled.",
          timestamp,
        };
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `I found **${unfinished.length} unfinished tasks** today. Would you like me to move them to tomorrow (${tomorrowStr})?`,
        timestamp,
        confirmationRequired: {
          actionType: 'reschedule_batch',
          description: `Move ${unfinished.length} unfinished tasks to tomorrow?`,
          impactLevel: 'medium',
          diff: unfinished.map(t => ({
            label: t.title,
            oldVal: `Today (${t.startTime || 'Anytime'})`,
            newVal: `Tomorrow ${tomorrowStr}`,
          })),
          payload: { taskIds: unfinished.map(t => t.id), targetDate: tomorrowStr },
        },
      };
    }

    // 5. "Break down goal X"
    if (raw.includes('break down') || raw.includes('milestone') || raw.includes('decompose')) {
      const goals = await this.get_goals();
      const targetGoal = goals.find(g => raw.includes(g.name.toLowerCase())) || goals[0];

      if (targetGoal) {
        const plan = this.goalService.generateDecompositionPlan(targetGoal.name, targetGoal.category);
        return {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Here is the structured breakdown for **${targetGoal.name}** with ${plan.suggestedMilestones.length} actionable milestones:`,
          timestamp,
          actionCards: plan.suggestedMilestones.map((m, idx) => ({
            id: `plan-ms-${idx}`,
            type: 'goal_breakdown',
            title: m.title,
            subtitle: m.description,
            payload: { goalId: targetGoal.id, milestone: m },
          })),
        };
      }
    }

    // 6. Default AI completion (via External LLM or Local Heuristic)
    const settings = await this.settingsRepo.getSettings();
    const provider = settings.apiKey 
      ? new ExternalLLMProvider(settings) 
      : new LocalHeuristicAIProvider();

    const todayTasks = await this.get_today_tasks();
    const sessions = await this.studyService.getAllSessions();
    const context = {
      todayDate: new Date().toISOString().split('T')[0],
      todayTasksCount: todayTasks.length,
      todayTasks: todayTasks.map(t => ({ title: t.title, status: t.status, duration: t.duration })),
      studySessionsCount: sessions.length,
    };

    const completion = await provider.generateCompletion(query, context);

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: completion,
      timestamp,
    };
  }

  getCapabilities(): AIAgentCapability[] {
    return [
      { name: 'get_today_tasks', signature: 'get_today_tasks() -> Promise<Task[]>', description: 'Retrieves all tasks scheduled for today, ordered by start time.', isImplementedInFoundation: true },
      { name: 'get_schedule', signature: 'get_schedule() -> Promise<Task[]>', description: 'Retrieves all scheduled tasks across days and weeks.', isImplementedInFoundation: true },
      { name: 'get_goals', signature: 'get_goals() -> Promise<Goal[]>', description: 'Retrieves active and completed long-term goals.', isImplementedInFoundation: true },
      { name: 'get_habits', signature: 'get_habits() -> Promise<Habit[]>', description: 'Retrieves habit list with consistency history.', isImplementedInFoundation: true },
      { name: 'get_study_history', signature: 'get_study_history() -> Promise<StudySession[]>', description: 'Retrieves historical study sessions with duration and accuracy.', isImplementedInFoundation: true },
      { name: 'create_task', signature: 'create_task(dto) -> Promise<Task>', description: 'Creates a validated task with schedule and duration.', isImplementedInFoundation: true },
      { name: 'reschedule_task', signature: 'reschedule_task(id, date, time) -> Promise<Task>', description: 'Moves a task to a target date and time slot.', isImplementedInFoundation: true },
      { name: 'complete_task', signature: 'complete_task(id) -> Promise<Task>', description: 'Marks task completed and timestamps execution.', isImplementedInFoundation: true },
      { name: 'generate_daily_plan', signature: 'generateDailyPlan(hours) -> Promise<AIMessage>', description: 'Generates structured daily execution plan matching available hours.', isImplementedInFoundation: true },
      { name: 'analyze_progress_data', signature: 'analyzeProgressData() -> Promise<AIProgressInsight[]>', description: 'Analyzes planned vs actual time drift, accuracy, and topic practice.', isImplementedInFoundation: true },
    ];
  }
}
