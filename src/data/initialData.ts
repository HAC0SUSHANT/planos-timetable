import type { 
  Task, 
  Goal, 
  Subject, 
  Habit, 
  StudySession, 
  Note, 
  LearningFile, 
  LearningSource, 
  Reminder, 
  UserSettings 
} from '../types';

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getPastDateString = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub-physics',
    name: 'Physics',
    code: 'PHY101',
    color: '#3B82F6', // Blue
    icon: 'Atom',
    totalStudyMinutes: 522, // 8h 42m
    questionsAttempted: 127,
    questionsCorrect: 103,
    accuracyRate: 81,
    topics: [
      { id: 'top-1', subjectId: 'sub-physics', title: 'Electrostatics & Electric Field', status: 'completed', order: 1, studyMinutes: 240, questionsAttempted: 60, questionsCorrect: 52, notes: 'Formula for dipole potential in polar coords is important.' },
      { id: 'top-2', subjectId: 'sub-physics', title: 'Gauss Law & Applications', status: 'in_progress', order: 2, studyMinutes: 180, questionsAttempted: 45, questionsCorrect: 36, notes: 'Focus on cylindrical Gaussian surfaces.' },
      { id: 'top-3', subjectId: 'sub-physics', title: 'Capacitance & Dielectrics', status: 'not_started', order: 3, studyMinutes: 102, questionsAttempted: 22, questionsCorrect: 15 },
    ],
  },
  {
    id: 'sub-python',
    name: 'Python',
    code: 'CS102',
    color: '#10B981', // Emerald
    icon: 'Code',
    totalStudyMinutes: 410,
    questionsAttempted: 95,
    questionsCorrect: 84,
    accuracyRate: 88,
    topics: [
      { id: 'top-4', subjectId: 'sub-python', title: 'Core Syntax & Data Structures', status: 'completed', order: 1, studyMinutes: 150, questionsAttempted: 40, questionsCorrect: 38 },
      { id: 'top-5', subjectId: 'sub-python', title: 'Functions, Lambdas & Decorators', status: 'in_progress', order: 2, studyMinutes: 160, questionsAttempted: 35, questionsCorrect: 30, notes: 'Need more practice with return values and args/kwargs.' },
      { id: 'top-6', subjectId: 'sub-python', title: 'AsyncIO & Concurrency', status: 'not_started', order: 3, studyMinutes: 100, questionsAttempted: 20, questionsCorrect: 16 },
    ],
  },
  {
    id: 'sub-math',
    name: 'Mathematics',
    code: 'MTH201',
    color: '#8B5CF6', // Purple
    icon: 'Compass',
    totalStudyMinutes: 480,
    questionsAttempted: 110,
    questionsCorrect: 86,
    accuracyRate: 78,
    topics: [
      { id: 'top-7', subjectId: 'sub-math', title: 'Differential Calculus & Limits', status: 'completed', order: 1, studyMinutes: 200, questionsAttempted: 50, questionsCorrect: 42 },
      { id: 'top-8', subjectId: 'sub-math', title: 'Integral Calculus & Area Under Curve', status: 'in_progress', order: 2, studyMinutes: 180, questionsAttempted: 40, questionsCorrect: 30, notes: 'Trigonometric substitution patterns need drill.' },
      { id: 'top-9', subjectId: 'sub-math', title: 'Linear Algebra & Vectors', status: 'not_started', order: 3, studyMinutes: 100, questionsAttempted: 20, questionsCorrect: 14 },
    ],
  },
  {
    id: 'sub-system',
    name: 'System Design',
    code: 'CS301',
    color: '#F59E0B', // Amber
    icon: 'Server',
    totalStudyMinutes: 210,
    questionsAttempted: 30,
    questionsCorrect: 26,
    accuracyRate: 87,
    topics: [
      { id: 'top-10', subjectId: 'sub-system', title: 'Load Balancing & Caching', status: 'completed', order: 1, studyMinutes: 120, questionsAttempted: 18, questionsCorrect: 16 },
      { id: 'top-11', subjectId: 'sub-system', title: 'Database Sharding & Replication', status: 'in_progress', order: 2, studyMinutes: 90, questionsAttempted: 12, questionsCorrect: 10 },
    ],
  },
];

export const INITIAL_GOALS: Goal[] = [
  {
    id: 'goal-1',
    name: 'Master Python Backend & Distributed Systems',
    description: 'Build production-ready microservices, understand asynchronous patterns, concurrency, and DB optimization.',
    startDate: '2026-09-01',
    targetDate: '2026-11-30',
    progress: 72,
    status: 'active',
    priority: 'high',
    category: 'Computer Science',
    subjectId: 'sub-python',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-10-01T12:00:00.000Z',
    milestones: [
      { id: 'ms-1', goalId: 'goal-1', title: 'Python Basics & Data Structures', completed: true, order: 1, totalTasks: 4, completedTasks: 4 },
      { id: 'ms-2', goalId: 'goal-1', title: 'Functions, Decorators & OOP', completed: true, order: 2, totalTasks: 4, completedTasks: 4 },
      { id: 'ms-3', goalId: 'goal-1', title: 'AsyncIO & Concurrency Practice', completed: false, order: 3, totalTasks: 3, completedTasks: 1 },
      { id: 'ms-4', goalId: 'goal-1', title: 'High-Throughput REST & Microservices Project', completed: false, order: 4, totalTasks: 3, completedTasks: 0 },
    ],
  },
  {
    id: 'goal-2',
    name: 'Ace Physics & Electromagnetism Examination',
    description: 'Solve 200+ previous year questions (PYQs) across Electrostatics, Magnetism, and Wave Optics with high accuracy.',
    startDate: '2026-09-15',
    targetDate: '2026-12-15',
    progress: 45,
    status: 'active',
    priority: 'critical',
    category: 'Physics',
    subjectId: 'sub-physics',
    createdAt: '2026-09-15T09:00:00.000Z',
    updatedAt: '2026-10-02T06:00:00.000Z',
    milestones: [
      { id: 'ms-5', goalId: 'goal-2', title: 'Complete Electrostatics PYQs (50 questions)', completed: true, order: 1, totalTasks: 3, completedTasks: 3 },
      { id: 'ms-6', goalId: 'goal-2', title: 'Gauss Law & Field Calculation masterclass', completed: false, order: 2, totalTasks: 4, completedTasks: 2 },
      { id: 'ms-7', goalId: 'goal-2', title: 'Capacitor Circuits & Dielectric Problems', completed: false, order: 3, totalTasks: 3, completedTasks: 0 },
    ],
  },
  {
    id: 'goal-3',
    name: 'Calculus and Linear Algebra Proficiency',
    description: 'Master single & multivariable calculus, integration techniques, and matrix decompositions.',
    startDate: '2026-08-20',
    targetDate: '2026-10-30',
    progress: 68,
    status: 'active',
    priority: 'high',
    category: 'Mathematics',
    subjectId: 'sub-math',
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-10-01T14:30:00.000Z',
    milestones: [
      { id: 'ms-8', goalId: 'goal-3', title: 'Differential equations & applications', completed: true, order: 1, totalTasks: 3, completedTasks: 3 },
      { id: 'ms-9', goalId: 'goal-3', title: 'Integration techniques & substitution', completed: true, order: 2, totalTasks: 4, completedTasks: 3 },
      { id: 'ms-10', goalId: 'goal-3', title: 'Vector calculus & line integrals', completed: false, order: 3, totalTasks: 3, completedTasks: 0 },
    ],
  },
];

export const getInitialTasks = (): Task[] => {
  const today = getTodayDateString();
  const now = new Date().toISOString();

  return [
    {
      id: 'task-1',
      title: 'Mathematics Calculus practice',
      description: 'Solve definite integrals and reduction formula problems.',
      date: today,
      startTime: '08:00',
      endTime: '09:00',
      duration: 60,
      actualDuration: 55,
      status: 'completed',
      priority: 'high',
      category: 'Mathematics',
      subjectId: 'sub-math',
      goalId: 'goal-3',
      milestoneId: 'ms-9',
      notes: 'Trig substitution problems 1 to 15 solved.',
      createdAt: now,
      updatedAt: now,
      completedAt: `${today}T09:00:00.000Z`,
    },
    {
      id: 'task-2',
      title: 'Python Functions & Decorators',
      description: 'Implement pure functions, memoization closures, and decorator benchmarks.',
      date: today,
      startTime: '09:30',
      endTime: '10:30',
      duration: 60,
      actualDuration: 60,
      status: 'completed',
      priority: 'medium',
      category: 'Python',
      subjectId: 'sub-python',
      goalId: 'goal-1',
      milestoneId: 'ms-2',
      notes: 'Completed memoization cache test suite.',
      createdAt: now,
      updatedAt: now,
      completedAt: `${today}T10:30:00.000Z`,
    },
    {
      id: 'task-3',
      title: 'Physics Electrostatics PYQs',
      description: 'Solve past 5 years JEE/Advanced electrostatics questions (Q1 to Q25).',
      date: today,
      startTime: '11:00',
      endTime: '12:00',
      duration: 60,
      actualDuration: 45,
      status: 'in_progress',
      priority: 'critical',
      category: 'Physics',
      subjectId: 'sub-physics',
      goalId: 'goal-2',
      milestoneId: 'ms-5',
      notes: 'Reviewed formula sheet for dipole potential.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-4',
      title: 'Physics Gauss Law Problems',
      description: 'Spherical and cylindrical symmetry flux problems with non-uniform charge density.',
      date: today,
      startTime: '14:00',
      endTime: '15:15',
      duration: 75,
      actualDuration: 0,
      status: 'pending',
      priority: 'high',
      category: 'Physics',
      subjectId: 'sub-physics',
      goalId: 'goal-2',
      milestoneId: 'ms-6',
      notes: 'Focus on boundary conditions and solid angle trick.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-5',
      title: 'Database Sharding & Replication',
      description: 'Deep dive into horizontal partitioning, consensus protocols, and leader election.',
      date: today,
      startTime: '16:00',
      endTime: '17:15',
      duration: 75,
      actualDuration: 0,
      status: 'pending',
      priority: 'medium',
      category: 'System Design',
      subjectId: 'sub-system',
      notes: 'Read chapter on Raft algorithm consensus.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-6',
      title: 'Daily Review & Adaptive Planning',
      description: 'Review planned vs actual time, update notes, and reflect on study blockers.',
      date: today,
      startTime: '21:00',
      endTime: '21:30',
      duration: 30,
      actualDuration: 0,
      status: 'pending',
      priority: 'medium',
      category: 'Review',
      notes: 'Audit today consistency.',
      createdAt: now,
      updatedAt: now,
    },
  ];
};

export const getInitialHabits = (): Habit[] => {
  const today = getTodayDateString();
  const d1 = getPastDateString(1);
  const d2 = getPastDateString(2);
  const d3 = getPastDateString(3);
  const d4 = getPastDateString(4);
  const d5 = getPastDateString(5);
  const d6 = getPastDateString(6);
  const d7 = getPastDateString(7);

  return [
    {
      id: 'h-1',
      name: 'Morning Deep Work Block (90 min)',
      description: 'Uninterrupted study before 10 AM without email or notifications.',
      frequency: 'daily',
      preferredTime: '08:00',
      startDate: '2026-09-01',
      goalId: 'goal-2',
      color: '#3B82F6',
      completionHistory: [d7, d6, d5, d4, d3, d2, d1, today],
      currentStreak: 8,
      bestStreak: 15,
      consistencyPercentage: 86,
      createdAt: '2026-09-01T07:00:00.000Z',
    },
    {
      id: 'h-2',
      name: 'Daily PYQs Drill (Min 10 questions)',
      description: 'Solve timed practice questions daily to build exam speed.',
      frequency: 'daily',
      preferredTime: '11:00',
      startDate: '2026-09-10',
      goalId: 'goal-2',
      color: '#10B981',
      completionHistory: [d5, d4, d3, d2, d1, today],
      currentStreak: 6,
      bestStreak: 12,
      consistencyPercentage: 80,
      createdAt: '2026-09-10T08:00:00.000Z',
    },
    {
      id: 'h-3',
      name: 'Evening Formula & Flashcard Review',
      description: 'Spaced repetition flashcards for Physics and Calculus definitions.',
      frequency: 'daily',
      preferredTime: '19:30',
      startDate: '2026-09-15',
      goalId: 'goal-3',
      color: '#F59E0B',
      completionHistory: [d4, d3, d2, d1],
      currentStreak: 4,
      bestStreak: 10,
      consistencyPercentage: 75,
      createdAt: '2026-09-15T18:00:00.000Z',
    },
    {
      id: 'h-4',
      name: 'Physical Workout / Running',
      description: 'Cardio or strength training to maintain mental resilience and energy.',
      frequency: 'weekdays',
      preferredTime: '18:00',
      startDate: '2026-09-01',
      color: '#EC4899',
      completionHistory: [d6, d4, d2, d1],
      currentStreak: 2,
      bestStreak: 9,
      consistencyPercentage: 72,
      createdAt: '2026-09-01T17:00:00.000Z',
    },
  ];
};

export const getInitialStudySessions = (): StudySession[] => {
  const today = getTodayDateString();
  const yesterday = getPastDateString(1);

  return [
    {
      id: 'ses-1',
      subjectId: 'sub-physics',
      topicId: 'top-1',
      taskId: 'task-1',
      date: yesterday,
      startTime: '10:00',
      endTime: '10:52',
      plannedDuration: 60,
      actualDuration: 52,
      questionsAttempted: 30,
      questionsCorrect: 24,
      accuracyRate: 80,
      difficulty: 'medium',
      sourceTitle: 'JEE Advanced 2022 PYQ Bank',
      notes: 'Gauss law is clear but calculations on spherical shell are slow.',
      interruptions: 1,
      createdAt: `${yesterday}T10:52:00.000Z`,
    },
    {
      id: 'ses-2',
      subjectId: 'sub-python',
      topicId: 'top-5',
      taskId: 'task-2',
      date: yesterday,
      startTime: '14:00',
      endTime: '14:48',
      plannedDuration: 45,
      actualDuration: 48,
      questionsAttempted: 20,
      questionsCorrect: 18,
      accuracyRate: 90,
      difficulty: 'easy',
      sourceTitle: 'Python Fluent Decorators Chapter',
      notes: 'Understood functools.wraps preserves docstrings and function signature.',
      interruptions: 0,
      createdAt: `${yesterday}T14:48:00.000Z`,
    },
    {
      id: 'ses-3',
      subjectId: 'sub-math',
      topicId: 'top-8',
      date: today,
      startTime: '08:00',
      endTime: '08:55',
      plannedDuration: 60,
      actualDuration: 55,
      questionsAttempted: 25,
      questionsCorrect: 20,
      accuracyRate: 80,
      difficulty: 'hard',
      sourceTitle: 'Integral Calculus Drill Sheet',
      notes: 'Trigonometric power reduction formulas need quick review before mock.',
      interruptions: 0,
      createdAt: `${today}T08:55:00.000Z`,
    },
  ];
};

export const getInitialNotes = (): Note[] => {
  const now = new Date().toISOString();
  return [
    {
      id: 'note-1',
      title: 'Gaussian Surfaces & Boundary Rules',
      content: 'Gaussian surface must pass through the point where field is evaluated. Do not include charges outside. For conductor in electrostatic equilibrium, electric field inside is strictly zero.',
      tags: ['physics', 'electrostatics', 'theory'],
      relatedEntity: { type: 'subject', id: 'sub-physics', name: 'Physics' },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'note-2',
      title: 'Python Decorators with Arguments',
      content: 'Remember that a decorator taking arguments requires 3 levels of nested functions: outer function takes arguments, middle function takes original function, innermost function is the wrapper taking args and kwargs.',
      tags: ['python', 'functions', 'advanced'],
      relatedEntity: { type: 'subject', id: 'sub-python', name: 'Python' },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'note-3',
      title: 'Reduction Formulas for Integrals',
      content: 'For I_n = integral of sin^n(x) dx, use integration by parts: write as sin^(n-1)(x) * sin(x) dx. The recurrence relation is I_n = -(1/n) * sin^(n-1)(x) cos(x) + ((n-1)/n) * I_(n-2).',
      tags: ['math', 'calculus', 'formulas'],
      relatedEntity: { type: 'subject', id: 'sub-math', name: 'Mathematics' },
      createdAt: now,
      updatedAt: now,
    },
  ];
};

export const getInitialSources = (): LearningSource[] => {
  return [
    {
      id: 'src-1',
      title: 'Python Official Documentation (asyncio)',
      url: 'https://docs.python.org/3/library/asyncio.html',
      type: 'documentation',
      description: 'Official reference for tasks, coroutines, and event loops.',
      subjectId: 'sub-python',
      tags: ['python', 'asyncio', 'official'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'src-2',
      title: 'MIT 8.02 Electricity & Magnetism Lectures',
      url: 'https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/',
      type: 'course',
      description: 'Prof. Walter Lewin video demonstrations on Electrostatics and Gauss Law.',
      subjectId: 'sub-physics',
      tags: ['physics', 'video', 'mit'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'src-3',
      title: '3Blue1Brown - Essence of Calculus',
      url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr',
      type: 'youtube',
      description: 'Visual geometric intuition for derivatives, chain rule, and integrals.',
      subjectId: 'sub-math',
      tags: ['math', 'calculus', 'visual'],
      createdAt: new Date().toISOString(),
    },
  ];
};

export const getInitialFiles = (): LearningFile[] => {
  return [
    {
      id: 'file-1',
      name: 'Physics_Electrostatics_Formula_CheatSheet.pdf',
      mimeType: 'application/pdf',
      size: 1420500, // 1.4 MB
      uploadDate: '2026-09-28',
      relatedSubjectId: 'sub-physics',
      tags: ['cheatsheet', 'formulas', 'pdf'],
    },
    {
      id: 'file-2',
      name: 'Calculus_Integration_By_Parts_Drills.pdf',
      mimeType: 'application/pdf',
      size: 890400,
      uploadDate: '2026-09-30',
      relatedSubjectId: 'sub-math',
      tags: ['exercises', 'drills', 'math'],
    },
  ];
};

export const getInitialReminders = (): Reminder[] => {
  const today = getTodayDateString();
  return [
    {
      id: 'rem-1',
      title: 'Physics Electrostatics starts in 10 minutes',
      message: 'Prepare formula sheet and previous year question notebook.',
      triggerAt: `${today}T10:50:00`,
      type: 'before_task',
      taskId: 'task-3',
      isTriggered: false,
      isDismissed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rem-2',
      title: 'Evening Habit: Formula & Flashcards',
      message: 'Review 20 spaced repetition flashcards before dinner.',
      triggerAt: `${today}T19:30:00`,
      type: 'habit',
      habitId: 'h-3',
      isTriggered: false,
      isDismissed: false,
      createdAt: new Date().toISOString(),
    },
  ];
};

export const INITIAL_SETTINGS: UserSettings = {
  userName: 'Sushant Kumar',
  timezone: 'Asia/Kolkata',
  themePreference: 'dark',
  startOfDay: '07:00',
  sleepHours: 7.5,
  availableHours: 6.0,
  defaultTaskDuration: 45,
  defaultBreakDuration: 10,
  quietHoursStart: '22:30',
  quietHoursEnd: '06:30',
  weekStartDay: 1, // Monday
  timeFormat: '12h',
  aiAutomationLevel: 'assisted',
  notificationsEnabled: true,
};
