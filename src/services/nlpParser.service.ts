import type { CreateTaskDTO, TaskPriority, RecurrenceFrequency } from '../types';
import { getTodayDateString } from '../data/initialData';

export interface ParsedTaskResult {
  rawInput: string;
  isValid: boolean;
  confidence: number;
  dto: CreateTaskDTO;
  extractedDetails: {
    title: string;
    date: string;
    startTime?: string;
    duration: number;
    priority: TaskPriority;
    subject?: string;
    isRecurring: boolean;
    recurrenceFrequency?: RecurrenceFrequency;
  };
}

export class NLPParserService {
  /**
   * Parses natural language task strings such as:
   * "Study Physics for 1 hour tomorrow at 7 PM"
   * "Workout every morning at 6"
   * "Finish 30 calculus questions this weekend"
   * "Review Python decorators at 14:00 for 45 min high priority"
   */
  static parseTaskString(input: string): ParsedTaskResult {
    const raw = input.trim();
    if (!raw) {
      return {
        rawInput: input,
        isValid: false,
        confidence: 0,
        dto: { title: '', date: getTodayDateString(), duration: 30 },
        extractedDetails: {
          title: '',
          date: getTodayDateString(),
          duration: 30,
          priority: 'medium',
          isRecurring: false,
        },
      };
    }

    let title = raw;
    let date = getTodayDateString();
    let startTime: string | undefined;
    let duration = 45; // default 45 min
    let priority: TaskPriority = 'medium';
    let subject: string | undefined;
    let isRecurring = false;
    let recurrenceFrequency: RecurrenceFrequency | undefined;

    // 1. Detect Subject / Keywords
    const subjectMatches = [
      { name: 'Physics', regex: /\b(physics|electrostatics|mechanics|optics)\b/i },
      { name: 'Python', regex: /\b(python|django|fastapi|asyncio|coding|programming)\b/i },
      { name: 'Mathematics', regex: /\b(math|maths|mathematics|calculus|algebra|integration)\b/i },
      { name: 'System Design', regex: /\b(system design|architecture|sharding|replication)\b/i },
      { name: 'Chemistry', regex: /\b(chemistry|organic|thermodynamics)\b/i },
    ];

    for (const sub of subjectMatches) {
      if (sub.regex.test(raw)) {
        subject = sub.name;
        break;
      }
    }

    // 2. Detect Priority
    if (/\b(urgent|critical|p0|asap)\b/i.test(raw)) {
      priority = 'critical';
      title = title.replace(/\b(urgent|critical|p0|asap)\b/gi, '');
    } else if (/\b(high priority|important|p1)\b/i.test(raw)) {
      priority = 'high';
      title = title.replace(/\b(high priority|important|p1)\b/gi, '');
    } else if (/\b(low priority|optional|p3)\b/i.test(raw)) {
      priority = 'low';
      title = title.replace(/\b(low priority|optional|p3)\b/gi, '');
    }

    // 3. Detect Recurrence
    if (/\b(every day|daily|every morning|every evening)\b/i.test(raw)) {
      isRecurring = true;
      recurrenceFrequency = 'daily';
      title = title.replace(/\b(every day|daily|every morning|every evening)\b/gi, '');
    } else if (/\b(every weekday|on weekdays)\b/i.test(raw)) {
      isRecurring = true;
      recurrenceFrequency = 'weekdays';
      title = title.replace(/\b(every weekday|on weekdays)\b/gi, '');
    } else if (/\b(every week|weekly)\b/i.test(raw)) {
      isRecurring = true;
      recurrenceFrequency = 'weekly';
      title = title.replace(/\b(every week|weekly)\b/gi, '');
    }

    // 4. Detect Date (tomorrow, next monday, this weekend, etc.)
    const today = new Date();
    if (/\btomorrow\b/i.test(raw)) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      date = tomorrow.toISOString().split('T')[0];
      title = title.replace(/\btomorrow\b/gi, '');
    } else if (/\bthis weekend\b/i.test(raw)) {
      const sat = new Date(today);
      const diff = 6 - sat.getDay();
      sat.setDate(today.getDate() + (diff >= 0 ? diff : diff + 7));
      date = sat.toISOString().split('T')[0];
      title = title.replace(/\bthis weekend\b/gi, '');
    } else if (/\b(on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(raw)) {
      const dayMap: Record<string, number> = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
      };
      const match = raw.match(/\b(on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
      if (match) {
        const targetDay = dayMap[match[2].toLowerCase()];
        const targetDate = new Date(today);
        let daysAhead = targetDay - today.getDay();
        if (daysAhead <= 0) daysAhead += 7;
        targetDate.setDate(today.getDate() + daysAhead);
        date = targetDate.toISOString().split('T')[0];
        title = title.replace(match[0], '');
      }
    }

    // 5. Detect Duration (e.g. "for 1 hour", "for 45 min", "for 90 minutes", "for 2 hours")
    const hourMatch = raw.match(/\bfor\s+(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs)\b/i);
    const minMatch = raw.match(/\bfor\s+(\d+)\s*(?:minute|minutes|min|mins)\b/i);

    if (hourMatch) {
      duration = Math.round(parseFloat(hourMatch[1]) * 60);
      title = title.replace(hourMatch[0], '');
    } else if (minMatch) {
      duration = parseInt(minMatch[1], 10);
      title = title.replace(minMatch[0], '');
    } else {
      // Check without "for" e.g. "60 min", "1 hour"
      const standaloneHour = raw.match(/\b(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs)\b/i);
      const standaloneMin = raw.match(/\b(\d+)\s*(?:minute|minutes|min|mins)\b/i);
      if (standaloneHour) {
        duration = Math.round(parseFloat(standaloneHour[1]) * 60);
        title = title.replace(standaloneHour[0], '');
      } else if (standaloneMin) {
        duration = parseInt(standaloneMin[1], 10);
        title = title.replace(standaloneMin[0], '');
      }
    }

    // 6. Detect Start Time (e.g. "at 7 PM", "at 19:00", "at 6:30 am", "at 6")
    const timeMatch12 = raw.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    const timeMatch24 = raw.match(/\bat\s+(\d{1,2}):(\d{2})\b/i);
    const simpleTimeMatch = raw.match(/\bat\s+(\d{1,2})\b/i);

    if (timeMatch12) {
      let h = parseInt(timeMatch12[1], 10);
      const m = timeMatch12[2] ? parseInt(timeMatch12[2], 10) : 0;
      const meridiem = timeMatch12[3].toLowerCase();
      if (meridiem === 'pm' && h < 12) h += 12;
      if (meridiem === 'am' && h === 12) h = 0;
      startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      title = title.replace(timeMatch12[0], '');
    } else if (timeMatch24) {
      const h = parseInt(timeMatch24[1], 10);
      const m = parseInt(timeMatch24[2], 10);
      startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      title = title.replace(timeMatch24[0], '');
    } else if (simpleTimeMatch) {
      let h = parseInt(simpleTimeMatch[1], 10);
      // If time is 1-6, assume PM unless "morning" is in raw string
      if (h <= 6 && !/morning|am/i.test(raw)) h += 12;
      startTime = `${String(h).padStart(2, '0')}:00`;
      title = title.replace(simpleTimeMatch[0], '');
    }

    // Clean up title
    title = title
      .replace(/\s+/g, ' ')
      .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
      .trim();

    if (!title) {
      title = subject ? `Study ${subject}` : 'New Task';
    }

    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);

    let category = 'general';
    if (/study|learn|revise|review|read|practice|solve/i.test(raw) || subject) {
      category = 'study';
    } else if (/workout|exercise|run|gym|walk|swim/i.test(raw)) {
      category = 'health';
    }

    const dto: CreateTaskDTO = {
      title,
      date,
      startTime,
      duration,
      priority,
      category,
      isRecurring,
      recurrence: isRecurring ? {
        frequency: recurrenceFrequency || 'daily',
        endCondition: 'forever',
      } : undefined,
    };

    return {
      rawInput: input,
      isValid: true,
      confidence: 0.95,
      dto,
      extractedDetails: {
        title,
        date,
        startTime,
        duration,
        priority,
        subject,
        isRecurring,
        recurrenceFrequency,
      },
    };
  }
}
