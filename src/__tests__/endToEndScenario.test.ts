import { describe, it, expect, beforeEach } from 'vitest';
import { TaskRepository } from '../data/task.repository';
import { TaskService } from '../services/task.service';
import { GoalRepository } from '../data/goal.repository';
import { GoalService } from '../services/goal.service';
import { ProgressService } from '../services/progress.service';
import { HabitRepository } from '../data/habit.repository';
import { HabitService } from '../services/habit.service';
import { StudyRepository } from '../data/study.repository';
import { SubjectRepository } from '../data/subject.repository';
import { StudyService } from '../services/study.service';
import { NoteRepository } from '../data/note.repository';
import { FileRepository } from '../data/file.repository';
import { SettingsRepository } from '../data/settings.repository';
import { AIAgentService } from '../services/aiAgent.service';
import { ReminderRepository } from '../data/reminder.repository';
import { ReminderService } from '../services/reminder.service';

describe('Prompt Section 41: Complete 20-Step End-to-End Scenario', () => {
  let taskRepo: TaskRepository;
  let taskService: TaskService;
  let goalRepo: GoalRepository;
  let goalService: GoalService;
  let progressService: ProgressService;
  let habitRepo: HabitRepository;
  let habitService: HabitService;
  let studyRepo: StudyRepository;
  let subjectRepo: SubjectRepository;
  let studyService: StudyService;
  let noteRepo: NoteRepository;
  let fileRepo: FileRepository;
  let settingsRepo: SettingsRepository;
  let aiAgent: AIAgentService;
  let reminderRepo: ReminderRepository;
  let reminderService: ReminderService;

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    taskRepo = new TaskRepository();
    taskService = new TaskService(taskRepo);
    goalRepo = new GoalRepository();
    goalService = new GoalService(goalRepo);
    progressService = new ProgressService(taskRepo);
    habitRepo = new HabitRepository();
    habitService = new HabitService(habitRepo);
    studyRepo = new StudyRepository();
    subjectRepo = new SubjectRepository();
    studyService = new StudyService(studyRepo, subjectRepo);
    noteRepo = new NoteRepository();
    fileRepo = new FileRepository();
    settingsRepo = new SettingsRepository();
    reminderRepo = new ReminderRepository();
    reminderService = new ReminderService(reminderRepo);

    aiAgent = new AIAgentService(
      taskService,
      goalService,
      progressService,
      habitService,
      studyService,
      noteRepo,
      fileRepo,
      settingsRepo
    );
  });

  it('successfully executes the 20-step end-to-end user journey', async () => {
    const today = new Date().toISOString().split('T')[0];

    // 1. Create goal: "Learn Python"
    const goal = await goalService.createGoal({
      name: 'Learn Python',
      description: 'Master core Python programming',
      startDate: today,
      priority: 'high',
      targetDate: '2026-10-30',
    });
    expect(goal.id).toBeDefined();

    // 2. Create milestone: "Functions"
    const goalWithMs = await goalService.createMilestone(goal.id, {
      title: 'Functions',
      description: 'Parameters, return values, closures',
      order: 1,
    });
    const milestone = goalWithMs.milestones![0];
    expect(milestone.title).toBe('Functions');

    // 3. Create tasks: "Learn function syntax", "Practice 20 problems"
    // 4. Schedule them
    const task1 = await taskService.createTask({
      title: 'Learn function syntax',
      duration: 45,
      priority: 'high',
      goalId: goal.id,
      milestoneId: milestone.id,
      date: today,
      startTime: '09:00',
    });

    const task2 = await taskService.createTask({
      title: 'Practice 20 problems',
      duration: 60,
      priority: 'critical',
      goalId: goal.id,
      milestoneId: milestone.id,
      date: today,
      startTime: '10:00',
    });

    // Also attach a reminder to task2
    const reminder = await reminderService.createReminder({
      title: 'Reminder: Practice 20 problems',
      type: 'at_start',
      targetDate: today,
      targetTime: '10:00',
      triggerAt: `${today}T10:00:00`,
      minutesBefore: 10,
      relatedTaskId: task2.id,
    });
    expect(reminder.id).toBeDefined();

    // 5. Start a task
    const startedTask1 = await taskService.startTask(task1.id);
    expect(startedTask1.status).toBe('in_progress');

    // 6. Run timer & 7. Finish study session & 8. Record actual duration
    const subject = await subjectRepo.create({ name: 'Python', color: '#10B981' });
    const studySession = await studyService.recordSession({
      subjectId: subject.id,
      taskId: task1.id,
      startTime: '09:00',
      endTime: '09:48',
      plannedDuration: 45,
      actualDuration: 48,
      questionsAttempted: 20,
      questionsCorrect: 18,
      difficulty: 'medium',
      notes: 'Need more practice with return values.',
    });
    expect(studySession.actualDuration).toBe(48);
    expect(studySession.accuracy).toBe(90);

    // 9. Add note: "Need more practice with return values."
    const note = await noteRepo.create({
      title: 'Python Functions Takeaway',
      content: 'Need more practice with return values.',
      tags: ['python', 'functions'],
      relatedEntity: { type: 'task', id: task1.id },
    });
    expect(note.id).toBeDefined();

    // 10. Complete task 1
    const completedTask1 = await taskService.completeTask(task1.id);
    expect(completedTask1.status).toBe('completed');

    // 11. Leave task 2 unfinished (status remains pending)
    // Mark any other pre-existing tasks completed so task2 is the clear next action
    const allToday = await taskService.getTodayTasks();
    for (const t of allToday) {
      if (t.id !== task2.id && t.status !== 'completed') {
        await taskService.completeTask(t.id);
      }
    }
    expect(task2.status).toBe('pending');

    // 12. Ask AI: "What should I do next?"
    // 13. AI reads the current state & 14. AI recommends the next task
    const nextResponse = await aiAgent.processUserQuery('What should I do next?');
    expect(nextResponse.content).toContain('Practice 20 problems');

    // 15. Ask AI: "Move my unfinished task to tomorrow."
    // 16. AI creates a proposed schedule change with diff
    const moveResponse = await aiAgent.processUserQuery('Move my unfinished task to tomorrow');
    expect(moveResponse.confirmationRequired).toBeDefined();
    expect(moveResponse.confirmationRequired?.actionType).toBe('reschedule_batch');

    // 17. User confirms proposed change
    const taskIds = (moveResponse.confirmationRequired!.payload.taskIds as string[]) || [];
    const targetDate = String(moveResponse.confirmationRequired!.payload.targetDate);
    for (const id of taskIds) {
      await taskService.rescheduleTask(id, targetDate);
      // 20. Reminder updates
      await reminderService.rescheduleTaskReminder(id, targetDate, '10:00');
    }

    // 18. Schedule updates
    const updatedTask2 = await taskService.getTaskById(task2.id);
    expect(updatedTask2?.date).toBe(targetDate);

    // 19. Progress updates (all today's tasks completed, 0 unfinished remaining on today's date)
    const progress = await progressService.calculateDailyProgress(today);
    expect(progress.completedTasks).toBe(progress.totalTasks);
    expect(progress.completionRate).toBe(100);

    // Verify reminder was also updated to new target date
    const updatedReminders = await reminderService.getDueReminders(targetDate, '10:00');
    expect(updatedReminders.length).toBeGreaterThan(0);
  });
});
