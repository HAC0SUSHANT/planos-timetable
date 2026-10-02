import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import type { FocusTimerState, TimerMode } from '../types';
import { LocalStorageClient } from '../data/storage';

interface StartTimerOptions {
  mode?: TimerMode;
  durationMinutes?: number;
  taskId?: string;
  subjectId?: string;
  taskTitle?: string;
}

interface TimerContextType {
  timer: FocusTimerState;
  startTimer: (options?: StartTimerOptions) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  finishTimer: () => void;
  resetTimer: () => void;
  isFinishModalOpen: boolean;
  setIsFinishModalOpen: (open: boolean) => void;
  completedSessionData: {
    taskId?: string;
    subjectId?: string;
    taskTitle?: string;
    plannedDuration: number;
    actualDuration: number;
  } | null;
}

const TIMER_STORAGE_KEY = 'ape_focus_timer_v1';

const DEFAULT_STATE: FocusTimerState = {
  mode: 'countdown',
  status: 'idle',
  plannedSeconds: 25 * 60,
  remainingSeconds: 25 * 60,
  elapsedSeconds: 0,
  pomodoroPhase: 'work',
  pomodoroRound: 1,
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Web Audio synthesizer chime for zero-asset timer alerts
const playTimerChime = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {
    console.warn('Audio chime error:', e);
  }
};

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timer, setTimer] = useState<FocusTimerState>(() => {
    const saved = LocalStorageClient.get<FocusTimerState | null>(TIMER_STORAGE_KEY, null);
    if (!saved) return DEFAULT_STATE;

    // Background recovery: compute elapsed delta if it was running
    if (saved.status === 'running' && saved.lastTickAt) {
      const deltaSec = Math.floor((Date.now() - saved.lastTickAt) / 1000);
      if (deltaSec > 0) {
        if (saved.mode === 'stopwatch') {
          return {
            ...saved,
            elapsedSeconds: saved.elapsedSeconds + deltaSec,
            lastTickAt: Date.now(),
          };
        } else {
          const rem = Math.max(0, saved.remainingSeconds - deltaSec);
          return {
            ...saved,
            remainingSeconds: rem,
            elapsedSeconds: saved.elapsedSeconds + (saved.remainingSeconds - rem),
            status: rem === 0 ? 'finished' : 'running',
            lastTickAt: Date.now(),
          };
        }
      }
    }
    return saved;
  });

  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [completedSessionData, setCompletedSessionData] = useState<{
    taskId?: string;
    subjectId?: string;
    taskTitle?: string;
    plannedDuration: number;
    actualDuration: number;
  } | null>(null);

  const timerRef = useRef<FocusTimerState>(timer);
  timerRef.current = timer;

  // Persist timer state
  useEffect(() => {
    LocalStorageClient.set(TIMER_STORAGE_KEY, timer);
  }, [timer]);

  // Tick loop
  useEffect(() => {
    if (timer.status !== 'running') return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev.status !== 'running') return prev;

        const now = Date.now();
        const delta = prev.lastTickAt ? Math.floor((now - prev.lastTickAt) / 1000) : 1;
        const tickDelta = Math.max(1, delta);

        if (prev.mode === 'stopwatch') {
          return {
            ...prev,
            elapsedSeconds: prev.elapsedSeconds + tickDelta,
            lastTickAt: now,
          };
        }

        // Countdown or Pomodoro
        const nextRemaining = Math.max(0, prev.remainingSeconds - tickDelta);
        const addedElapsed = prev.remainingSeconds - nextRemaining;

        if (nextRemaining === 0) {
          playTimerChime();
          // If pomodoro work phase ends, advance to break
          if (prev.mode === 'pomodoro') {
            if (prev.pomodoroPhase === 'work') {
              const nextRound = prev.pomodoroRound + 1;
              const isLongBreak = nextRound % 4 === 0;
              const breakSecs = isLongBreak ? 15 * 60 : 5 * 60;
              return {
                ...prev,
                status: 'paused',
                pomodoroPhase: isLongBreak ? 'longBreak' : 'shortBreak',
                pomodoroRound: nextRound,
                plannedSeconds: breakSecs,
                remainingSeconds: breakSecs,
                elapsedSeconds: prev.elapsedSeconds + addedElapsed,
                lastTickAt: now,
              };
            } else {
              // Break ended, back to work
              const workSecs = 25 * 60;
              return {
                ...prev,
                status: 'paused',
                pomodoroPhase: 'work',
                plannedSeconds: workSecs,
                remainingSeconds: workSecs,
                elapsedSeconds: prev.elapsedSeconds + addedElapsed,
                lastTickAt: now,
              };
            }
          }

          // Countdown complete
          return {
            ...prev,
            status: 'finished',
            remainingSeconds: 0,
            elapsedSeconds: prev.elapsedSeconds + addedElapsed,
            lastTickAt: now,
          };
        }

        return {
          ...prev,
          remainingSeconds: nextRemaining,
          elapsedSeconds: prev.elapsedSeconds + addedElapsed,
          lastTickAt: now,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.status]);

  const startTimer = useCallback((options?: StartTimerOptions) => {
    const mode = options?.mode || 'countdown';
    let durationMins = options?.durationMinutes || 25;
    if (mode === 'pomodoro') durationMins = 25;

    const plannedSecs = durationMins * 60;

    const newState: FocusTimerState = {
      mode,
      status: 'running',
      taskId: options?.taskId,
      subjectId: options?.subjectId,
      taskTitle: options?.taskTitle,
      plannedSeconds: plannedSecs,
      remainingSeconds: plannedSecs,
      elapsedSeconds: 0,
      pomodoroPhase: 'work',
      pomodoroRound: 1,
      startedAt: Date.now(),
      lastTickAt: Date.now(),
    };

    setTimer(newState);
  }, []);

  const pauseTimer = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      status: 'paused',
      lastTickAt: undefined,
    }));
  }, []);

  const resumeTimer = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      status: 'running',
      lastTickAt: Date.now(),
    }));
  }, []);

  const stopTimer = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      status: 'idle',
      remainingSeconds: prev.plannedSeconds,
      lastTickAt: undefined,
    }));
  }, []);

  const finishTimer = useCallback(() => {
    const current = timerRef.current;
    const actualMins = Math.max(1, Math.round(current.elapsedSeconds / 60));
    const plannedMins = Math.round(current.plannedSeconds / 60);

    setCompletedSessionData({
      taskId: current.taskId,
      subjectId: current.subjectId,
      taskTitle: current.taskTitle,
      plannedDuration: plannedMins,
      actualDuration: actualMins,
    });

    setTimer(prev => ({
      ...prev,
      status: 'idle',
      remainingSeconds: prev.plannedSeconds,
      elapsedSeconds: 0,
      lastTickAt: undefined,
    }));

    setIsFinishModalOpen(true);
  }, []);

  const resetTimer = useCallback(() => {
    setTimer(DEFAULT_STATE);
  }, []);

  return (
    <TimerContext.Provider
      value={{
        timer,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        finishTimer,
        resetTimer,
        isFinishModalOpen,
        setIsFinishModalOpen,
        completedSessionData,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimer must be used within a TimerProvider');
  return context;
};
