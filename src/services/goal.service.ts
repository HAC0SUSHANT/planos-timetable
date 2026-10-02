import type { IGoalRepository } from '../data/repository.interface';
import type { Goal, CreateGoalDTO, UpdateGoalDTO, Milestone, GoalDecompositionPlan } from '../types';

export class GoalService {
  private readonly goalRepo: IGoalRepository;

  constructor(goalRepo: IGoalRepository) {
    this.goalRepo = goalRepo;
  }

  async getGoals(): Promise<Goal[]> {
    return this.goalRepo.getAll();
  }

  async getActiveGoals(): Promise<Goal[]> {
    return this.goalRepo.getActive();
  }

  async getGoalById(id: string): Promise<Goal | null> {
    return this.goalRepo.getById(id);
  }

  async getById(id: string): Promise<Goal | null> {
    return this.goalRepo.getById(id);
  }

  async createMilestone(goalId: string, milestoneData: { title: string; description?: string; dueDate?: string; order?: number }): Promise<Goal> {
    const goal = await this.getGoalById(goalId);
    if (!goal) throw new Error(`Goal ${goalId} not found`);

    const newMilestone: Milestone = {
      id: `ms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      goalId,
      title: milestoneData.title,
      description: milestoneData.description,
      dueDate: milestoneData.dueDate,
      completed: false,
      order: milestoneData.order || ((goal.milestones?.length || 0) + 1),
      totalTasks: 0,
      completedTasks: 0,
    };

    const milestones = [...(goal.milestones || []), newMilestone];
    return this.goalRepo.update(goalId, { milestones });
  }

  async createGoal(dto: CreateGoalDTO): Promise<Goal> {
    if (!dto.name || dto.name.trim() === '') {
      throw new Error('Goal name is required');
    }

    const milestones: Milestone[] = (dto.milestones || []).map((m, idx) => ({
      id: `ms-${Date.now()}-${idx}`,
      goalId: '',
      title: m.title,
      description: m.description,
      dueDate: m.dueDate,
      completed: false,
      order: idx + 1,
      totalTasks: 0,
      completedTasks: 0,
    }));

    const newGoalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> = {
      name: dto.name.trim(),
      description: dto.description?.trim() || '',
      startDate: dto.startDate || new Date().toISOString().split('T')[0],
      targetDate: dto.targetDate || '',
      progress: Math.min(100, Math.max(0, dto.progress || 0)),
      status: dto.status || 'active',
      priority: dto.priority || 'medium',
      category: dto.category?.trim(),
      subjectId: dto.subjectId,
      milestones,
      notes: dto.notes,
    };

    return this.goalRepo.create(newGoalData);
  }

  async updateGoal(id: string, updates: UpdateGoalDTO): Promise<Goal> {
    const existing = await this.goalRepo.getById(id);
    if (!existing) {
      throw new Error(`Goal with ID ${id} not found.`);
    }

    const patch: Partial<Goal> = { ...updates };
    if (updates.progress !== undefined) {
      patch.progress = Math.min(100, Math.max(0, updates.progress));
      if (patch.progress === 100 && existing.status === 'active') {
        patch.status = 'completed';
      }
    }

    return this.goalRepo.update(id, patch);
  }

  async deleteGoal(id: string): Promise<boolean> {
    return this.goalRepo.delete(id);
  }

  async toggleMilestone(goalId: string, milestoneId: string): Promise<Goal> {
    const goal = await this.getById(goalId);
    if (!goal) throw new Error(`Goal ${goalId} not found`);

    const milestones = (goal.milestones || []).map(m => {
      if (m.id === milestoneId) {
        return { ...m, completed: !m.completed };
      }
      return m;
    });

    const total = milestones.length;
    const completed = milestones.filter(m => m.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : goal.progress;
    const status = progress === 100 ? 'completed' : goal.status === 'completed' ? 'active' : goal.status;

    return this.goalRepo.update(goalId, { milestones, progress, status });
  }

  /**
   * Generates a structured breakdown of a large goal into achievable milestones and tasks.
   * Enables the user to review and edit before applying!
   */
  generateDecompositionPlan(goalName: string, category?: string): GoalDecompositionPlan {
    const name = goalName.trim();
    const isPython = /python|backend|programming/i.test(name + (category || ''));
    const isPhysics = /physics|electrostatics|exam/i.test(name + (category || ''));
    const isMath = /math|calculus|algebra/i.test(name + (category || ''));

    if (isPython) {
      return {
        goalName: name,
        description: 'Structured mastery roadmap from foundational syntax to distributed services.',
        suggestedMilestones: [
          {
            title: 'Milestone 1: Core Syntax & Data Structures',
            description: 'Master lists, dictionaries, sets, comprehensions, and memory model.',
            suggestedTasks: [
              { title: 'Study Python Memory Model & References', estimatedMinutes: 45, priority: 'high' },
              { title: 'List & Dictionary Comprehension drills', estimatedMinutes: 60, priority: 'medium' },
              { title: 'Implement custom Data Structure exercises', estimatedMinutes: 60, priority: 'medium' },
            ],
          },
          {
            title: 'Milestone 2: Functional Patterns & Decorators',
            description: 'Understand closures, decorators with arguments, and functools.',
            suggestedTasks: [
              { title: 'Implement closure-based caching decorator', estimatedMinutes: 45, priority: 'high' },
              { title: 'Practice 15 decorator exercises', estimatedMinutes: 60, priority: 'medium' },
            ],
          },
          {
            title: 'Milestone 3: Asynchronous Programming & Concurrency',
            description: 'Deep dive into asyncio event loops, coroutines, and thread pools.',
            suggestedTasks: [
              { title: 'Build Async HTTP scraper with aiohttp', estimatedMinutes: 90, priority: 'high' },
              { title: 'Benchmark asyncio vs threading vs multiprocessing', estimatedMinutes: 60, priority: 'medium' },
            ],
          },
        ],
      };
    }

    if (isPhysics) {
      return {
        goalName: name,
        description: 'Systematic examination readiness: theory mastery, formula drills, and PYQ sets.',
        suggestedMilestones: [
          {
            title: 'Milestone 1: Core Field Theory & Potentials',
            description: 'Electric field lines, potential energy, and dipole mechanics.',
            suggestedTasks: [
              { title: 'Solve 20 Dipole Potential problems', estimatedMinutes: 60, priority: 'high' },
              { title: 'Review electrostatics formula sheet', estimatedMinutes: 30, priority: 'medium' },
            ],
          },
          {
            title: 'Milestone 2: Gauss Law Masterclass',
            description: 'High symmetry surfaces, non-uniform volume charges, and conductor boundaries.',
            suggestedTasks: [
              { title: 'Cylindrical and planar Gaussian surfaces', estimatedMinutes: 60, priority: 'high' },
              { title: 'Past 5-year Gauss Law examination questions', estimatedMinutes: 75, priority: 'high' },
            ],
          },
          {
            title: 'Milestone 3: Capacitance & Energy Stored',
            description: 'Dielectric insertion, combinations, and electrostatic pressure.',
            suggestedTasks: [
              { title: 'Variable dielectric capacitor problems', estimatedMinutes: 60, priority: 'medium' },
              { title: 'Full chapter mock test (30 questions)', estimatedMinutes: 90, priority: 'high' },
            ],
          },
        ],
      };
    }

    if (isMath) {
      return {
        goalName: name,
        description: 'Rigorous mathematical mastery from fundamental definitions to timed drills.',
        suggestedMilestones: [
          {
            title: 'Milestone 1: Fundamentals & Theorems',
            description: 'Core identities, definitions, and proof understanding.',
            suggestedTasks: [
              { title: 'Study theorem proofs and identities', estimatedMinutes: 45, priority: 'high' },
              { title: 'Derive standard formulas without reference notes', estimatedMinutes: 45, priority: 'medium' },
            ],
          },
          {
            title: 'Milestone 2: Practice & Problem Solving',
            description: 'Intensive drills and step-by-step calculations.',
            suggestedTasks: [
              { title: 'Solve 30 calculus practice questions', estimatedMinutes: 75, priority: 'high' },
              { title: 'Analyze mistakes and log tricky steps', estimatedMinutes: 40, priority: 'medium' },
            ],
          },
        ],
      };
    }

    // Default universal decomposition
    return {
      goalName: name,
      description: 'Progressive breakdown into initial fundamentals, execution drills, and final capstone.',
      suggestedMilestones: [
        {
          title: 'Milestone 1: Fundamentals & Research',
          description: 'Establish foundational concepts, glossary, and core syllabus.',
          suggestedTasks: [
            { title: `Read introductory chapter for ${name}`, estimatedMinutes: 60, priority: 'high' },
            { title: 'Create reference notes and formula sheet', estimatedMinutes: 45, priority: 'medium' },
          ],
        },
        {
          title: 'Milestone 2: Intensive Practice & Drills',
          description: 'Apply concepts through hands-on practice problems.',
          suggestedTasks: [
            { title: 'Solve 25 targeted practice questions', estimatedMinutes: 75, priority: 'high' },
            { title: 'Review error log and misunderstood concepts', estimatedMinutes: 45, priority: 'medium' },
          ],
        },
        {
          title: 'Milestone 3: Synthesis & Final Review',
          description: 'Consolidate knowledge and perform timed assessment.',
          suggestedTasks: [
            { title: 'Comprehensive mock examination / project test', estimatedMinutes: 90, priority: 'high' },
            { title: 'Final review and summary note compilation', estimatedMinutes: 45, priority: 'medium' },
          ],
        },
      ],
    };
  }
}
