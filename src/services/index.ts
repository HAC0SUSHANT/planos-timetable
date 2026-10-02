import { LocalTaskRepository } from '../data/task.repository';
import { LocalGoalRepository } from '../data/goal.repository';
import { LocalSubjectRepository } from '../data/subject.repository';
import { LocalHabitRepository } from '../data/habit.repository';
import { LocalStudyRepository } from '../data/study.repository';
import { LocalNoteRepository } from '../data/note.repository';
import { LocalFileRepository } from '../data/file.repository';
import { LocalReminderRepository } from '../data/reminder.repository';
import { LocalReviewRepository } from '../data/review.repository';
import { LocalSettingsRepository } from '../data/settings.repository';

import { TaskService } from './task.service';
import { GoalService } from './goal.service';
import { ProgressService } from './progress.service';
import { HabitService } from './habit.service';
import { StudyService } from './study.service';
import { ReminderService } from './reminder.service';
import { VoiceService } from './voice.service';
import { AIAgentService } from './aiAgent.service';

export * from './task.service';
export * from './goal.service';
export * from './progress.service';
export * from './habit.service';
export * from './study.service';
export * from './reminder.service';
export * from './voice.service';
export * from './aiAgent.service';
export * from './nlpParser.service';
export * from './schedulingEngine.service';
export * from './adaptiveScheduler.service';
export * from './externalProviders';

export interface ServiceContainer {
  taskService: TaskService;
  goalService: GoalService;
  progressService: ProgressService;
  habitService: HabitService;
  studyService: StudyService;
  reminderService: ReminderService;
  voiceService: VoiceService;
  aiAgentService: AIAgentService;
  taskRepo: LocalTaskRepository;
  goalRepo: LocalGoalRepository;
  subjectRepo: LocalSubjectRepository;
  habitRepo: LocalHabitRepository;
  studyRepo: LocalStudyRepository;
  noteRepo: LocalNoteRepository;
  fileRepo: LocalFileRepository;
  reminderRepo: LocalReminderRepository;
  reviewRepo: LocalReviewRepository;
  settingsRepo: LocalSettingsRepository;
}

export const createServices = (): ServiceContainer => {
  const taskRepo = new LocalTaskRepository();
  const goalRepo = new LocalGoalRepository();
  const subjectRepo = new LocalSubjectRepository();
  const habitRepo = new LocalHabitRepository();
  const studyRepo = new LocalStudyRepository();
  const noteRepo = new LocalNoteRepository();
  const fileRepo = new LocalFileRepository();
  const reminderRepo = new LocalReminderRepository();
  const reviewRepo = new LocalReviewRepository();
  const settingsRepo = new LocalSettingsRepository();

  const taskService = new TaskService(taskRepo);
  const goalService = new GoalService(goalRepo);
  const progressService = new ProgressService(taskRepo);
  const habitService = new HabitService(habitRepo);
  const studyService = new StudyService(studyRepo, subjectRepo);
  const reminderService = new ReminderService(reminderRepo);
  const voiceService = new VoiceService();

  const aiAgentService = new AIAgentService(
    taskService,
    goalService,
    progressService,
    habitService,
    studyService,
    noteRepo,
    fileRepo,
    settingsRepo
  );

  return {
    taskService,
    goalService,
    progressService,
    habitService,
    studyService,
    reminderService,
    voiceService,
    aiAgentService,
    taskRepo,
    goalRepo,
    subjectRepo,
    habitRepo,
    studyRepo,
    noteRepo,
    fileRepo,
    reminderRepo,
    reviewRepo,
    settingsRepo,
  };
};
