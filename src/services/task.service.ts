import type { ITaskRepository } from '../data/repository.interface';
import type { Task, CreateTaskDTO, UpdateTaskDTO, TaskRecurrence } from '../types';
import { getTodayDateString } from '../data/initialData';

export class TaskService {
  private readonly taskRepo: ITaskRepository;

  constructor(taskRepo: ITaskRepository) {
    this.taskRepo = taskRepo;
  }

  async getTodayTasks(date?: string): Promise<Task[]> {
    const targetDate = date || getTodayDateString();
    return this.taskRepo.getByDate(targetDate);
  }

  async getAllTasks(): Promise<Task[]> {
    return this.taskRepo.getAll();
  }

  async getTaskById(id: string): Promise<Task | null> {
    return this.taskRepo.getById(id);
  }

  async getNextTask(date?: string): Promise<Task | null> {
    const tasks = await this.getTodayTasks(date);
    
    // 1. Current in_progress task takes highest priority
    const inProgress = tasks.find(t => t.status === 'in_progress');
    if (inProgress) return inProgress;

    // 2. First paused task
    const paused = tasks.find(t => t.status === 'paused');
    if (paused) return paused;

    // 3. First pending task with scheduled time
    const pendingWithTime = tasks.find(t => t.status === 'pending' && t.startTime);
    if (pendingWithTime) return pendingWithTime;

    // 4. Any pending task
    const anyPending = tasks.find(t => t.status === 'pending');
    return anyPending || null;
  }

  async createTask(dto: CreateTaskDTO): Promise<Task> {
    if (!dto.title || dto.title.trim() === '') {
      throw new Error('Task title is required');
    }

    let duration = dto.duration || 30;
    if (dto.startTime && dto.endTime && (!dto.duration || dto.duration <= 0)) {
      const [sh, sm] = dto.startTime.split(':').map(Number);
      const [eh, em] = dto.endTime.split(':').map(Number);
      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;
      if (endMinutes > startMinutes) {
        duration = endMinutes - startMinutes;
      }
    }

    const newTaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: dto.title.trim(),
      description: dto.description?.trim(),
      date: dto.date || getTodayDateString(),
      startTime: dto.startTime || undefined,
      endTime: dto.endTime || undefined,
      duration: duration,
      actualDuration: 0,
      status: 'pending',
      priority: dto.priority || 'medium',
      category: dto.category?.trim(),
      subjectId: dto.subjectId,
      goalId: dto.goalId,
      milestoneId: dto.milestoneId,
      notes: dto.notes?.trim(),
      isRecurring: dto.isRecurring || false,
      recurrence: dto.recurrence,
    };

    return this.taskRepo.create(newTaskData);
  }

  async updateTask(id: string, updates: UpdateTaskDTO): Promise<Task> {
    const existing = await this.taskRepo.getById(id);
    if (!existing) {
      throw new Error(`Task with ID ${id} not found.`);
    }

    const patch: Partial<Task> = { ...updates };
    if (updates.status === 'completed' && !existing.completedAt) {
      patch.completedAt = new Date().toISOString();
      if (!patch.actualDuration && existing.duration) {
        // If actual duration was not manually set, default actual to planned
        patch.actualDuration = existing.actualDuration || existing.duration;
      }
    } else if (updates.status && updates.status !== 'completed') {
      patch.completedAt = undefined;
    }

    const updated = await this.taskRepo.update(id, patch);

    // If task was completed and is recurring, spawn next occurrence
    if (updates.status === 'completed' && existing.isRecurring && existing.recurrence) {
      await this.spawnNextRecurringOccurrence(existing);
    }

    return updated;
  }

  async completeTask(id: string): Promise<Task> {
    return this.updateTask(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  }

  async startTask(id: string): Promise<Task> {
    return this.updateTask(id, { status: 'in_progress' });
  }

  async pauseTask(id: string): Promise<Task> {
    return this.updateTask(id, { status: 'paused' });
  }

  async resumeTask(id: string): Promise<Task> {
    return this.updateTask(id, { status: 'in_progress' });
  }

  async skipTask(id: string): Promise<Task> {
    return this.updateTask(id, { status: 'skipped' });
  }

  async cancelTask(id: string): Promise<Task> {
    return this.updateTask(id, { status: 'cancelled' });
  }

  async rescheduleTask(id: string, newDate: string, newStartTime?: string): Promise<Task> {
    return this.updateTask(id, {
      date: newDate,
      startTime: newStartTime,
      status: 'pending',
    });
  }

  async duplicateTask(id: string): Promise<Task> {
    const existing = await this.taskRepo.getById(id);
    if (!existing) throw new Error(`Task ${id} not found`);

    const copyDto: CreateTaskDTO = {
      title: `${existing.title} (Copy)`,
      description: existing.description,
      date: existing.date,
      startTime: existing.startTime,
      duration: existing.duration,
      priority: existing.priority,
      category: existing.category,
      subjectId: existing.subjectId,
      goalId: existing.goalId,
      milestoneId: existing.milestoneId,
      notes: existing.notes,
    };
    return this.createTask(copyDto);
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.taskRepo.delete(id);
  }

  /**
   * Generates the next occurrence for a recurring task
   */
  private async spawnNextRecurringOccurrence(task: Task): Promise<Task | null> {
    if (!task.recurrence) return null;
    const rec = task.recurrence;

    // Check count limit
    const currentCount = (rec.occurrenceCount || 1) + 1;
    if (rec.endCondition === 'count' && rec.maxOccurrences && currentCount > rec.maxOccurrences) {
      return null;
    }

    // Calculate next date
    const currentDate = new Date(task.date);
    const nextDate = new Date(currentDate);

    switch (rec.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + (rec.interval || 1));
        break;
      case 'weekdays':
        do {
          nextDate.setDate(nextDate.getDate() + 1);
        } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7 * (rec.interval || 1));
        break;
      case 'interval':
        nextDate.setDate(nextDate.getDate() + (rec.interval || 2));
        break;
      case 'custom_days':
        if (rec.daysOfWeek && rec.daysOfWeek.length > 0) {
          let found = false;
          for (let step = 1; step <= 7; step++) {
            const probe = new Date(currentDate);
            probe.setDate(probe.getDate() + step);
            if (rec.daysOfWeek.includes(probe.getDay())) {
              nextDate.setDate(probe.getDate());
              found = true;
              break;
            }
          }
          if (!found) nextDate.setDate(nextDate.getDate() + 7);
        } else {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;
      default:
        nextDate.setDate(nextDate.getDate() + 1);
    }

    const nextDateStr = nextDate.toISOString().split('T')[0];

    // Check until_date limit
    if (rec.endCondition === 'until_date' && rec.endDate && nextDateStr > rec.endDate) {
      return null;
    }

    const updatedRecurrence: TaskRecurrence = {
      ...rec,
      occurrenceCount: currentCount,
    };

    const nextTaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: task.title,
      description: task.description,
      date: nextDateStr,
      startTime: task.startTime,
      duration: task.duration,
      actualDuration: 0,
      status: 'pending',
      priority: task.priority,
      category: task.category,
      subjectId: task.subjectId,
      goalId: task.goalId,
      milestoneId: task.milestoneId,
      isRecurring: true,
      recurrence: updatedRecurrence,
      parentTaskId: task.id,
    };

    return this.taskRepo.create(nextTaskData);
  }

  async generateRecurringInstances(baseTask: Task, count: number): Promise<Task[]> {
    const instances: Task[] = [];
    let current = baseTask;
    for (let i = 0; i < count; i++) {
      const next = await this.spawnNextRecurringOccurrence(current);
      if (!next) break;
      instances.push(next);
      current = next;
    }
    return instances;
  }
}
