import type { Goal, Milestone } from '../types';
import type { IGoalRepository } from './repository.interface';
import { LocalStorageClient } from './storage';
import { INITIAL_GOALS } from './initialData';

const GOALS_STORAGE_KEY = 'ape_goals_v1';

export class LocalGoalRepository implements IGoalRepository {
  private getGoals(): Goal[] {
    const stored = LocalStorageClient.get<Goal[] | null>(GOALS_STORAGE_KEY, null);
    if (!stored || stored.length === 0) {
      LocalStorageClient.set(GOALS_STORAGE_KEY, INITIAL_GOALS);
      return INITIAL_GOALS;
    }
    return stored;
  }

  private saveGoals(goals: Goal[]): void {
    LocalStorageClient.set(GOALS_STORAGE_KEY, goals);
  }

  async getAll(): Promise<Goal[]> {
    return this.getGoals();
  }

  async getById(id: string): Promise<Goal | null> {
    const goals = this.getGoals();
    return goals.find(g => g.id === id) || null;
  }

  async getActive(): Promise<Goal[]> {
    const goals = this.getGoals();
    return goals.filter(g => g.status === 'active');
  }

  async create(item: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    const goals = this.getGoals();
    const now = new Date().toISOString();
    const newGoal: Goal = {
      ...item,
      id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    goals.push(newGoal);
    this.saveGoals(goals);
    return newGoal;
  }

  async update(id: string, updates: Partial<Goal>): Promise<Goal> {
    const goals = this.getGoals();
    const index = goals.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error(`Goal with id ${id} not found`);
    }

    const updatedGoal: Goal = {
      ...goals[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    goals[index] = updatedGoal;
    this.saveGoals(goals);
    return updatedGoal;
  }

  async delete(id: string): Promise<boolean> {
    const goals = this.getGoals();
    const initialLen = goals.length;
    const filtered = goals.filter(g => g.id !== id);
    if (filtered.length !== initialLen) {
      this.saveGoals(filtered);
      return true;
    }
    return false;
  }

  async addMilestone(goalId: string, milestone: Omit<Milestone, 'id' | 'goalId'>): Promise<Goal> {
    const goal = await this.getById(goalId);
    if (!goal) throw new Error(`Goal ${goalId} not found`);

    const newMilestone: Milestone = {
      ...milestone,
      id: `ms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      goalId,
    };

    const milestones = [...(goal.milestones || []), newMilestone];
    return this.update(goalId, { milestones });
  }

  async updateMilestone(goalId: string, milestoneId: string, updates: Partial<Milestone>): Promise<Goal> {
    const goal = await this.getById(goalId);
    if (!goal) throw new Error(`Goal ${goalId} not found`);

    const milestones = (goal.milestones || []).map(m => {
      if (m.id === milestoneId) {
        return { ...m, ...updates };
      }
      return m;
    });

    // Recompute goal progress based on milestones
    let progress = goal.progress;
    if (milestones.length > 0) {
      const completed = milestones.filter(m => m.completed).length;
      progress = Math.round((completed / milestones.length) * 100);
    }

    return this.update(goalId, { 
      milestones, 
      progress,
      status: progress === 100 ? 'completed' : goal.status 
    });
  }
}

export { LocalGoalRepository as GoalRepository };
