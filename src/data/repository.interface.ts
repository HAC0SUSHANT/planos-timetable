import type { Task, TaskFilter, Goal, Subject } from '../types';

export interface IRepository<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

export interface ITaskRepository extends IRepository<Task> {
  getByDate(date: string): Promise<Task[]>;
  filter(filter: TaskFilter): Promise<Task[]>;
}

export interface IGoalRepository extends IRepository<Goal> {
  getActive(): Promise<Goal[]>;
}

export interface ISubjectRepository {
  getAll(): Promise<Subject[]>;
  getById(id: string): Promise<Subject | null>;
  create?(item: Omit<Subject, 'id'>): Promise<Subject>;
}
