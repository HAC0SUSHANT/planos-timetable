import type { Task, TaskFilter } from '../types';
import type { ITaskRepository } from './repository.interface';
import { LocalStorageClient } from './storage';
import { getInitialTasks } from './initialData';

const TASKS_STORAGE_KEY = 'ape_tasks_v1';

export class LocalTaskRepository implements ITaskRepository {
  private getTasks(): Task[] {
    const stored = LocalStorageClient.get<Task[] | null>(TASKS_STORAGE_KEY, null);
    if (!stored || stored.length === 0) {
      const initial = getInitialTasks();
      LocalStorageClient.set(TASKS_STORAGE_KEY, initial);
      return initial;
    }
    return stored;
  }

  private saveTasks(tasks: Task[]): void {
    LocalStorageClient.set(TASKS_STORAGE_KEY, tasks);
  }

  async getAll(): Promise<Task[]> {
    return this.getTasks();
  }

  async getById(id: string): Promise<Task | null> {
    const tasks = this.getTasks();
    return tasks.find(t => t.id === id) || null;
  }

  async getByDate(date: string): Promise<Task[]> {
    const tasks = this.getTasks();
    return tasks
      .filter(t => t.date === date)
      .sort((a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return a.startTime.localeCompare(b.startTime);
      });
  }

  async filter(filter: TaskFilter): Promise<Task[]> {
    let tasks = this.getTasks();
    if (filter.date) {
      tasks = tasks.filter(t => t.date === filter.date);
    }
    if (filter.status) {
      tasks = tasks.filter(t => t.status === filter.status);
    }
    if (filter.priority) {
      tasks = tasks.filter(t => t.priority === filter.priority);
    }
    if (filter.subjectId) {
      tasks = tasks.filter(t => t.subjectId === filter.subjectId);
    }
    if (filter.goalId) {
      tasks = tasks.filter(t => t.goalId === filter.goalId);
    }
    if (filter.milestoneId) {
      tasks = tasks.filter(t => t.milestoneId === filter.milestoneId);
    }
    return tasks;
  }

  async create(item: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const tasks = this.getTasks();
    const now = new Date().toISOString();
    const newTask: Task = {
      ...item,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    tasks.push(newTask);
    this.saveTasks(tasks);
    return newTask;
  }

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error(`Task with id ${id} not found`);
    }

    const updatedTask: Task = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    tasks[index] = updatedTask;
    this.saveTasks(tasks);
    return updatedTask;
  }

  async delete(id: string): Promise<boolean> {
    const tasks = this.getTasks();
    const initialLen = tasks.length;
    const filtered = tasks.filter(t => t.id !== id);
    if (filtered.length !== initialLen) {
      this.saveTasks(filtered);
      return true;
    }
    return false;
  }

  async duplicate(id: string): Promise<Task> {
    const original = await this.getById(id);
    if (!original) throw new Error(`Task ${id} not found to duplicate`);

    const copyData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      ...original,
      title: `${original.title} (Copy)`,
      status: 'pending',
      completedAt: undefined,
      actualDuration: 0,
    };
    return this.create(copyData);
  }
}

export { LocalTaskRepository as TaskRepository };
