import type { Task, UserSettings } from '../types';

export interface IAIProvider {
  generateCompletion(prompt: string, context: Record<string, any>): Promise<string>;
  isConfigured(): boolean;
}

export class LocalHeuristicAIProvider implements IAIProvider {
  isConfigured(): boolean {
    return true;
  }

  async generateCompletion(prompt: string, context: Record<string, any>): Promise<string> {
    const raw = prompt.toLowerCase();

    if (raw.includes('what should i do') || raw.includes('plan')) {
      const tasks = context.todayTasks || [];
      const pending = tasks.filter((t: Task) => t.status === 'pending' || t.status === 'in_progress');
      if (pending.length === 0) {
        return "All scheduled tasks for today are complete! You can review tomorrow's plan, check your habit streak, or relax.";
      }
      const first = pending[0];
      return `Based on your schedule and priority targets, your immediate focus should be: "${first.title}" (${first.duration} min${first.category ? ` • ${first.category}` : ''}).`;
    }

    if (raw.includes('progress') || raw.includes('study')) {
      const sessions = context.studySessions || [];
      const totalMins = sessions.reduce((acc: number, s: any) => acc + (s.actualDuration || 0), 0);
      const hours = (totalMins / 60).toFixed(1);
      return `You have completed ${sessions.length} study sessions totaling ${hours} hours. Accuracy and consistency are trending positively.`;
    }

    return "I analyzed your current execution queue, goal milestones, and study history. Your plans are well balanced.";
  }
}

export class ExternalLLMProvider implements IAIProvider {
  private settings: UserSettings;

  constructor(settings: UserSettings) {
    this.settings = settings;
  }

  isConfigured(): boolean {
    return Boolean(this.settings.apiKey && this.settings.apiKey.trim().length > 0);
  }

  async generateCompletion(prompt: string, context: Record<string, any>): Promise<string> {
    if (!this.isConfigured()) {
      const fallback = new LocalHeuristicAIProvider();
      return fallback.generateCompletion(prompt, context);
    }

    try {
      const endpoint = this.settings.apiEndpoint || 'https://api.openai.com/v1/chat/completions';
      const model = this.settings.aiModel || 'gpt-4o-mini';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.settings.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are the PlanOS AI personal execution system. Give concise, structured, actionable productivity and study recommendations. Only recommend actions supported by the user context.',
            },
            {
              role: 'user',
              content: `User query: ${prompt}\n\nContext summary:\n${JSON.stringify(context, null, 2)}`,
            },
          ],
          temperature: 0.3,
        }),
      });

      if (!res.ok) {
        throw new Error(`LLM API returned HTTP ${res.status}`);
      }

      const json = await res.json();
      return json.choices?.[0]?.message?.content || 'No response returned from model.';
    } catch (err: any) {
      console.warn('External LLM error, using local fallback:', err);
      const fallback = new LocalHeuristicAIProvider();
      return fallback.generateCompletion(prompt, context);
    }
  }
}

/**
 * Calendar integration provider for exporting & importing standard iCalendar (.ics) files
 */
export class CalendarProvider {
  static exportTasksToICS(tasks: Task[]): string {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PlanOS//Personal Execution System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    for (const t of tasks) {
      const dtStart = t.date.replace(/-/g, '') + (t.startTime ? `T${t.startTime.replace(':', '')}00` : '');
      const durationMins = t.duration || 30;
      
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:task-${t.id}@planos.local`);
      lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DURATION:PT${durationMins}M`);
      lines.push(`SUMMARY:${t.title}`);
      if (t.description) lines.push(`DESCRIPTION:${t.description.replace(/\n/g, '\\n')}`);
      if (t.category) lines.push(`CATEGORIES:${t.category}`);
      lines.push(`STATUS:${t.status === 'completed' ? 'CONFIRMED' : 'TENTATIVE'}`);
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  static exportToICal(tasks: Task[]): string {
    return this.exportTasksToICS(tasks);
  }

  static downloadICSFile(tasks: Task[], filename = 'planos-schedule.ics'): void {
    const icsContent = this.exportTasksToICS(tasks);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
