import React, { useState } from 'react';
import { useTimer } from '../../context/TimerContext';
import { Play, Pause, Square, CheckSquare, Clock, Zap } from 'lucide-react';

export const TimerWidget: React.FC = () => {
  const { timer, startTimer, pauseTimer, resumeTimer, stopTimer, finishTimer } = useTimer();
  const [showConfig, setShowConfig] = useState(false);
  const [customMins, setCustomMins] = useState('45');

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isRunning = timer.status === 'running';
  const isPaused = timer.status === 'paused';
  const isIdle = timer.status === 'idle';
  const isFinished = timer.status === 'finished';

  const displayTime = timer.mode === 'stopwatch'
    ? formatSeconds(timer.elapsedSeconds)
    : formatSeconds(timer.remainingSeconds);

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          backgroundColor: isRunning ? 'var(--bg-active)' : 'var(--bg-input)',
          border: isRunning ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
          borderRadius: 'var(--radius-full)',
          boxShadow: isRunning ? '0 0 10px rgba(59, 130, 246, 0.25)' : 'none',
          transition: 'all var(--transition-fast)',
        }}
      >
        <button
          onClick={() => setShowConfig(!showConfig)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: isRunning ? 'var(--accent-text)' : 'var(--text-secondary)',
          }}
          title="Click to configure Focus Timer"
        >
          <Clock size={15} color={isRunning ? 'var(--accent-text)' : 'var(--text-muted)'} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '0.875rem',
              color: isFinished ? 'var(--success-text)' : 'var(--text-primary)',
            }}
          >
            {displayTime}
          </span>
          {timer.mode === 'pomodoro' && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              ({timer.pomodoroPhase === 'work' ? `R${timer.pomodoroRound}` : 'Break'})
            </span>
          )}
        </button>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
          {isIdle && (
            <button
              className="btn-icon"
              style={{ padding: '4px', color: 'var(--accent-text)' }}
              onClick={() => startTimer({ mode: 'countdown', durationMinutes: 25 })}
              title="Start 25m focus"
            >
              <Play size={14} />
            </button>
          )}

          {isRunning && (
            <button
              className="btn-icon"
              style={{ padding: '4px', color: 'var(--warning-text)' }}
              onClick={pauseTimer}
              title="Pause"
            >
              <Pause size={14} />
            </button>
          )}

          {isPaused && (
            <button
              className="btn-icon"
              style={{ padding: '4px', color: 'var(--accent-text)' }}
              onClick={resumeTimer}
              title="Resume"
            >
              <Play size={14} />
            </button>
          )}

          {!isIdle && (
            <button
              className="btn-icon"
              style={{ padding: '4px', color: 'var(--success-text)' }}
              onClick={finishTimer}
              title="Finish & Save Actual Time"
            >
              <CheckSquare size={14} />
            </button>
          )}

          {!isIdle && (
            <button
              className="btn-icon"
              style={{ padding: '4px', color: 'var(--danger-text)' }}
              onClick={stopTimer}
              title="Stop / Reset"
            >
              <Square size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Timer Mode Selector Dropdown */}
      {showConfig && (
        <div
          style={{
            position: 'absolute',
            top: '115%',
            right: 0,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            minWidth: '220px',
            padding: '12px',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Focus Timer Engine
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'flex-start' }}
              onClick={() => {
                startTimer({ mode: 'countdown', durationMinutes: 25 });
                setShowConfig(false);
              }}
            >
              <Zap size={14} color="#3B82F6" /> 25m Quick Focus
            </button>

            <button
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'flex-start' }}
              onClick={() => {
                startTimer({ mode: 'pomodoro' });
                setShowConfig(false);
              }}
            >
              <Zap size={14} color="#10B981" /> Pomodoro (25m / 5m)
            </button>

            <button
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'flex-start' }}
              onClick={() => {
                startTimer({ mode: 'stopwatch' });
                setShowConfig(false);
              }}
            >
              <Clock size={14} color="#8B5CF6" /> Stopwatch (Count up)
            </button>

            <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input
                type="number"
                className="form-input"
                style={{ padding: '4px 8px', fontSize: '0.8rem', width: '70px' }}
                value={customMins}
                onChange={e => setCustomMins(e.target.value)}
                min="5"
                step="5"
              />
              <button
                className="btn btn-primary btn-sm"
                style={{ flex: 1 }}
                onClick={() => {
                  const m = parseInt(customMins, 10) || 45;
                  startTimer({ mode: 'countdown', durationMinutes: m });
                  setShowConfig(false);
                }}
              >
                Set {customMins}m
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
