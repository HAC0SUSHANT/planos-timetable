import { describe, it, expect, beforeEach } from 'vitest';
import { GoalRepository } from '../data/goal.repository';
import { GoalService } from '../services/goal.service';

describe('Goal System & Milestone Planning', () => {
  let goalRepo: GoalRepository;
  let goalService: GoalService;

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    goalRepo = new GoalRepository();
    goalService = new GoalService(goalRepo);
  });

  it('creates goal and derives real progress from milestone completion', async () => {
    const goal = await goalService.createGoal({
      name: 'Learn Python',
      description: 'Master core Python, data structures, and OOP',
      startDate: '2026-10-02',
      priority: 'high',
      targetDate: '2026-10-30',
    });

    expect(goal.progress).toBe(0);

    // Add milestones
    await goalService.createMilestone(goal.id, {
      title: 'Python Basics',
      description: 'Syntax, variables, conditionals',
      order: 1,
    });
    const updatedWithM2 = await goalService.createMilestone(goal.id, {
      title: 'Functions & Modules',
      description: 'Parameters, returns, scopes',
      order: 2,
    });

    expect(updatedWithM2.milestones?.length).toBe(2);
    expect(updatedWithM2.progress).toBe(0);

    // Toggle first milestone completed
    const m1Id = updatedWithM2.milestones![0].id;
    const progressAfterM1 = await goalService.toggleMilestone(goal.id, m1Id);

    // Progress must be 50% (1 of 2 milestones completed, not arbitrary fake number)
    expect(progressAfterM1.progress).toBe(50);
    expect(progressAfterM1.milestones![0].completed).toBe(true);

    // Toggle second milestone completed
    const m2Id = updatedWithM2.milestones![1].id;
    const progressAfterM2 = await goalService.toggleMilestone(goal.id, m2Id);

    // 2 of 2 completed => 100%
    expect(progressAfterM2.progress).toBe(100);
  });

  it('decomposes a large goal into structured milestones and execution tasks', () => {
    const plan = goalService.generateDecompositionPlan('Learn Python', 'Programming');

    expect(plan.goalName).toBe('Learn Python');
    expect(plan.suggestedMilestones.length).toBeGreaterThanOrEqual(3);

    // Verify first milestone has structured execution tasks
    const firstMs = plan.suggestedMilestones[0];
    expect(firstMs.title).toBeDefined();
    expect(firstMs.suggestedTasks.length).toBeGreaterThan(0);
    expect(firstMs.suggestedTasks[0].estimatedMinutes).toBeGreaterThan(0);
    expect(firstMs.suggestedTasks[0].priority).toBeDefined();
  });
});
