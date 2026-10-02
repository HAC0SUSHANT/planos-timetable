import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import type { AIAutomationLevel } from '../types';
import {
  Sun,
  Moon,
  Database,
  Download,
  RotateCcw,
  Calendar,
  Key,
  Sliders,
  Check,
} from 'lucide-react';
import { LocalStorageClient } from '../data/storage';
import { getInitialTasks, INITIAL_GOALS, INITIAL_SUBJECTS, getInitialHabits, getInitialNotes } from '../data/initialData';
import { CalendarProvider } from '../services/externalProviders';

export const SettingsView: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { settings, updateSettings, tasks, refreshData } = useApp();

  const [availableHours, setAvailableHours] = useState(String(settings.availableHours || 6.0));
  const [defaultDuration, setDefaultDuration] = useState(String(settings.defaultTaskDuration || 45));
  const [sleepStart, setSleepStart] = useState(
    typeof settings.sleepHours === 'object' && settings.sleepHours ? settings.sleepHours.start : '23:00'
  );
  const [sleepEnd, setSleepEnd] = useState(
    typeof settings.sleepHours === 'object' && settings.sleepHours ? settings.sleepHours.end : '07:00'
  );
  const [automationLevel, setAutomationLevel] = useState<AIAutomationLevel>(settings.aiAutomationLevel || 'assisted');
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [weekStart, setWeekStart] = useState<'monday' | 'sunday'>(
    settings.weekStartDay === 0 || settings.weekStartDay === 'sunday' ? 'sunday' : 'monday'
  );
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>(settings.timeFormat || '12h');

  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateSettings({
      availableHours: parseFloat(availableHours) || 6.0,
      defaultTaskDuration: parseInt(defaultDuration, 10) || 45,
      sleepHours: {
        start: sleepStart,
        end: sleepEnd,
      },
      aiAutomationLevel: automationLevel,
      apiKey: apiKey.trim() || undefined,
      weekStartDay: weekStart,
      timeFormat,
    });

    setSavedMessage('Settings and preferences saved successfully.');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleExportICal = () => {
    const icsContent = CalendarProvider.exportToICal(tasks);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planos-schedule-${new Date().toISOString().split('T')[0]}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDataJSON = () => {
    const fullExport = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      tasks: LocalStorageClient.get('ape_tasks_v1', []),
      goals: LocalStorageClient.get('ape_goals_v1', []),
      subjects: LocalStorageClient.get('ape_subjects_v1', []),
      habits: LocalStorageClient.get('ape_habits_v1', []),
      studySessions: LocalStorageClient.get('ape_study_sessions_v1', []),
      notes: LocalStorageClient.get('ape_notes_v1', []),
      sources: LocalStorageClient.get('ape_sources_v1', []),
      settings: LocalStorageClient.get('ape_settings_v1', {}),
    };

    const blob = new Blob([JSON.stringify(fullExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planos-full-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = async () => {
    if (window.confirm('Reset all schedule, tasks, habits, and goals to initial baseline?')) {
      LocalStorageClient.set('ape_tasks_v1', getInitialTasks());
      LocalStorageClient.set('ape_goals_v1', INITIAL_GOALS);
      LocalStorageClient.set('ape_subjects_v1', INITIAL_SUBJECTS);
      LocalStorageClient.set('ape_habits_v1', getInitialHabits());
      LocalStorageClient.set('ape_notes_v1', getInitialNotes());
      await refreshData();
      setSavedMessage('Data restored to initial baseline successfully.');
      setTimeout(() => setSavedMessage(null), 3000);
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 2px 0' }}>
          Settings & Customization
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          Scheduling constraints, AI automation safety level, calendar export, and data backups.
        </p>
      </div>

      {savedMessage && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--success-subtle)',
            color: 'var(--success-text)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={16} /> {savedMessage}
        </div>
      )}

      {/* 1. Appearance Section */}
      <div className="card" style={{ padding: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
          Interface & Appearance
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Theme Mode</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Currently active: <strong style={{ textTransform: 'capitalize' }}>{theme}</strong> mode
            </div>
          </div>

          <button className="btn btn-secondary" onClick={toggleTheme}>
            {theme === 'dark' ? (
              <>
                <Sun size={15} /> Switch to Light Mode
              </>
            ) : (
              <>
                <Moon size={15} /> Switch to Dark Mode
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Realistic Scheduling Engine Constraints */}
      <form onSubmit={handleSavePreferences} className="card" style={{ padding: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 'var(--space-xs)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="var(--accent-text)" />
          Scheduling Engine Constraints
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          The realistic scheduling engine uses these constraints to detect workload overloads and avoid impossible daily plans.
        </p>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Available Study/Work Hours Per Day</label>
            <input
              type="number"
              className="form-input"
              value={availableHours}
              onChange={e => setAvailableHours(e.target.value)}
              step="0.5"
              min="1"
              max="16"
              required
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Tasks exceeding this will trigger an overflow advisory.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Default Task Duration (Minutes)</label>
            <input
              type="number"
              className="form-input"
              value={defaultDuration}
              onChange={e => setDefaultDuration(e.target.value)}
              min="15"
              step="15"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Sleep Hours Start</label>
            <input
              type="time"
              className="form-input"
              value={sleepStart}
              onChange={e => setSleepStart(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sleep Hours End</label>
            <input
              type="time"
              className="form-input"
              value={sleepEnd}
              onChange={e => setSleepEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Week Start Day</label>
            <select
              className="form-select"
              value={weekStart}
              onChange={e => setWeekStart(e.target.value as any)}
            >
              <option value="monday">Monday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Time Display Format</label>
            <select
              className="form-select"
              value={timeFormat}
              onChange={e => setTimeFormat(e.target.value as any)}
            >
              <option value="12h">12-hour (e.g. 7:00 PM)</option>
              <option value="24h">24-hour (e.g. 19:00)</option>
            </select>
          </div>
        </div>

        {/* 3. AI Automation Safety Level */}
        <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '6px' }}>
            AI Automation Safety Level
          </h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
            Choose how much autonomy the AI execution agent has when making schedule adjustments.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
            <label
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: automationLevel === 'manual' ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-input)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="automation"
                checked={automationLevel === 'manual'}
                onChange={() => setAutomationLevel('manual')}
                style={{ marginRight: '6px' }}
              />
              <strong>Manual</strong>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                AI suggests plans in chat but never touches the database.
              </div>
            </label>

            <label
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: automationLevel === 'assisted' ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-input)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="automation"
                checked={automationLevel === 'assisted'}
                onChange={() => setAutomationLevel('assisted')}
                style={{ marginRight: '6px' }}
              />
              <strong>Assisted (Recommended)</strong>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                AI executes low-risk items, asks for diff confirmation on multi-task changes.
              </div>
            </label>

            <label
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: automationLevel === 'automatic' ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-input)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="automation"
                checked={automationLevel === 'automatic'}
                onChange={() => setAutomationLevel('automatic')}
                style={{ marginRight: '6px' }}
              />
              <strong>Automatic</strong>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                AI automatically balances routine overloads within user capacity limits.
              </div>
            </label>
          </div>
        </div>

        {/* 4. External AI Model API Key (Optional) */}
        <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Key size={15} color="var(--accent-text)" />
            External AI Model Integration (Optional)
          </h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
            PlanOS includes a built-in deterministic Heuristic AI provider that works 100% offline. If you wish to connect an external LLM (e.g. OpenAI / Gemini), supply your API key below. Secrets remain strictly client-side.
          </p>

          <input
            type="password"
            className="form-input"
            placeholder="sk-..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-lg)' }}>
          Save Configuration
        </button>
      </form>

      {/* 5. Calendar & Data Sync */}
      <div className="card" style={{ padding: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 'var(--space-xs)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--accent-text)" />
          Calendar & External Integrations
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          Sync your commitments with Google Calendar, Apple Calendar, or Outlook using standard iCal format.
        </p>

        <button className="btn btn-secondary" onClick={handleExportICal}>
          <Download size={15} /> Export Schedule (.ics iCal)
        </button>
      </div>

      {/* 6. Data Backup & Reset */}
      <div className="card" style={{ padding: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 'var(--space-xs)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={18} color="var(--accent-text)" />
          Backup & Data Recovery
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          Export your complete local database (tasks, goals, milestones, habits, study sessions, notes, sources) as JSON.
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleExportDataJSON}>
            <Download size={15} /> Export Full JSON Backup
          </button>

          <button className="btn btn-outline" onClick={handleResetData} style={{ color: 'var(--danger-text)' }}>
            <RotateCcw size={15} /> Reset to Default Baseline
          </button>
        </div>
      </div>
    </div>
  );
};
