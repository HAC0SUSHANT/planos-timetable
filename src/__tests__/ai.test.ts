import { describe, it, expect, beforeEach } from 'vitest';
import { NLPParserService } from '../services/nlpParser.service';
import { AIAgentService } from '../services/aiAgent.service';
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

describe('AI Agent & Safety Confirmation Layer', () => {
  let aiAgent: AIAgentService;
  let taskService: TaskService;

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    const taskRepo = new TaskRepository();
    taskService = new TaskService(taskRepo);
    const goalRepo = new GoalRepository();
    const goalService = new GoalService(goalRepo);
    const progressService = new ProgressService(taskRepo);
    const habitRepo = new HabitRepository();
    const habitService = new HabitService(habitRepo);
    const studyRepo = new StudyRepository();
    const subjectRepo = new SubjectRepository();
    const studyService = new StudyService(studyRepo, subjectRepo);
    const noteRepo = new NoteRepository();
    const fileRepo = new FileRepository();
    const settingsRepo = new SettingsRepository();

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

  it('parses natural language task requests deterministically into structured DTOs', () => {
    const parsed = NLPParserService.parseTaskString('Study Physics for 1 hour tomorrow at 7 PM');

    expect(parsed.isValid).toBe(true);
    expect(parsed.dto.title).toContain('Study Physics');
    expect(parsed.dto.duration).toBe(60);
    expect(parsed.dto.startTime).toBe('19:00');
    expect(parsed.dto.category).toBe('study');
  });

  it('parses complex recurring workout requests', () => {
    const parsed = NLPParserService.parseTaskString('Workout every morning at 6');

    expect(parsed.isValid).toBe(true);
    expect(parsed.dto.title).toContain('Workout');
    expect(parsed.dto.startTime).toBe('06:00');
    expect(parsed.dto.category).toBe('health');
    expect(parsed.dto.recurrence?.frequency).toBe('daily');
  });

  it('requires confirmation diffs before modifying user tasks', async () => {
    // Schedule an unfinished task for today
    const today = new Date().toISOString().split('T')[0];
    await taskService.createTask({
      title: 'Finish 30 calculus questions',
      duration: 60,
      priority: 'high',
      date: today,
    });

    const response = await aiAgent.processUserQuery('Move my unfinished tasks to tomorrow');

    expect(response.confirmationRequired).toBeDefined();
    expect(response.confirmationRequired?.actionType).toBe('reschedule_batch');
    expect(response.confirmationRequired?.diff.length).toBeGreaterThan(0);

    const found = response.confirmationRequired!.diff.some(d => d.label.includes('Finish 30 calculus questions'));
    expect(found).toBe(true);
    expect(response.confirmationRequired!.diff[0].newVal).toContain('Tomorrow');
  });

  it('generates a structured daily plan matching available hours', async () => {
    const planMessage = await aiAgent.generateDailyPlan(4.0);

    expect(planMessage.role).toBe('assistant');
    expect(planMessage.actionCards).toBeDefined();
    expect(planMessage.actionCards?.length).toBeGreaterThan(0);

    // Sum of planned minutes should be within capacity
    const totalMinutes = planMessage.actionCards!.reduce((sum, c) => sum + (c.duration || 0), 0);
    expect(totalMinutes).toBeLessThanOrEqual(240);
  });
});
