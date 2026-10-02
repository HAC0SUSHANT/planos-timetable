import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useTimer } from '../../context/TimerContext';
import { useApp } from '../../context/AppContext';
import type { StudyDifficulty } from '../../types';
import { CheckCircle2, Award, Clock } from 'lucide-react';

export const SessionCompleteModal: React.FC = () => {
  const { isFinishModalOpen, setIsFinishModalOpen, completedSessionData } = useTimer();
  const { recordStudySession, subjects } = useApp();

  const [questionsAttempted, setQuestionsAttempted] = useState<string>('25');
  const [questionsCorrect, setQuestionsCorrect] = useState<string>('20');
  const [difficulty, setDifficulty] = useState<StudyDifficulty>('medium');
  const [notes, setNotes] = useState<string>('');
  const [actualDuration, setActualDuration] = useState<string>(
    String(completedSessionData?.actualDuration || 45)
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    completedSessionData?.subjectId || subjects[0]?.id || ''
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

  const attemptedNum = parseInt(questionsAttempted, 10) || 0;
  const correctNum = parseInt(questionsCorrect, 10) || 0;
  const accuracy = attemptedNum > 0 ? Math.round((correctNum / attemptedNum) * 100) : 0;

  const handleSave = async () => {
    const planned = completedSessionData?.plannedDuration || 45;
    const actual = parseInt(actualDuration, 10) || planned;

    const subjectId = completedSessionData?.subjectId || selectedSubjectId;
    const topicId = selectedTopicId || (currentSubject?.topics?.[0]?.id);

    await recordStudySession({
      subjectId,
      topicId,
      taskId: completedSessionData?.taskId,
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      plannedDuration: planned,
      actualDuration: actual,
      questionsAttempted: attemptedNum,
      questionsCorrect: correctNum,
      difficulty,
      notes: notes.trim() || undefined,
      sourceTitle: completedSessionData?.taskTitle || 'Study Session',
    });

    setIsFinishModalOpen(false);
  };

  if (!isFinishModalOpen) return null;

  return (
    <Modal
      isOpen={isFinishModalOpen}
      onClose={() => setIsFinishModalOpen(false)}
      title="Session Complete! Record Actual Progress"
      footer={
        <>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setIsFinishModalOpen(false)}
          >
            Continue Session
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
          >
            <CheckCircle2 size={16} /> Finish & Save
          </button>
        </>
      }
    >
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 'var(--space-md)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--success-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--success-text)',
            }}
          >
            <Award size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              {completedSessionData?.taskTitle || 'Focus Session Finished'}
            </h4>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={13} /> Planned: {completedSessionData?.plannedDuration || 45}m
              </span>
              <span>•</span>
              <span style={{ color: 'var(--accent-text)', fontWeight: 600 }}>
                Actual: {actualDuration}m
              </span>
            </div>
          </div>
        </div>

        {/* Subject & Topic Selector if not preset */}
        {!completedSessionData?.subjectId && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Subject</label>
              <select
                className="form-select"
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Topic</label>
              <select
                className="form-select"
                value={selectedTopicId}
                onChange={e => setSelectedTopicId(e.target.value)}
              >
                {currentSubject?.topics?.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Actual Duration & Difficulty */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Actual Time Spent (minutes)</label>
            <input
              type="number"
              className="form-input"
              value={actualDuration}
              onChange={e => setActualDuration(e.target.value)}
              min="1"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Perceived Difficulty</label>
            <select
              className="form-select"
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as StudyDifficulty)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard / Complex</option>
            </select>
          </div>
        </div>

        {/* Questions and Accuracy */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Questions Attempted</label>
            <input
              type="number"
              className="form-input"
              value={questionsAttempted}
              onChange={e => setQuestionsAttempted(e.target.value)}
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Questions Correct</label>
            <input
              type="number"
              className="form-input"
              value={questionsCorrect}
              onChange={e => setQuestionsCorrect(e.target.value)}
              min="0"
            />
          </div>
        </div>

        {attemptedNum > 0 && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: accuracy >= 75 ? 'var(--success-subtle)' : 'var(--warning-subtle)',
              color: accuracy >= 75 ? 'var(--success-text)' : 'var(--warning-text)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-md)',
            }}
          >
            <span>Calculated Practice Accuracy:</span>
            <span>{accuracy}% ({correctNum}/{attemptedNum})</span>
          </div>
        )}

        {/* Execution Notes */}
        <div className="form-group">
          <label className="form-label">Study Notes & Key Takeaways</label>
          <textarea
            className="form-textarea"
            placeholder="e.g. Gauss law calculations are clear but need faster spherical shell integrals..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
};
