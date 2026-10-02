import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTimer } from '../context/TimerContext';
import type { Topic, StudyDifficulty } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  BookOpen,
  Plus,
  Play,
  Clock,
  FileText,
  ExternalLink,
} from 'lucide-react';

export const StudyView: React.FC = () => {
  const {
    subjects,
    studySessions,
    notes,
    files,
    sources,
    createSubject,
    addTopic,
    recordStudySession,
  } = useApp();

  const { startTimer } = useTimer();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);
  const [isManualSessionModalOpen, setIsManualSessionModalOpen] = useState(false);

  // New subject state
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#3B82F6');

  // New topic state
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicEstimatedMinutes, setNewTopicEstimatedMinutes] = useState('60');

  // Manual session state
  const [manualTopicId, setManualTopicId] = useState('');
  const [manualDuration, setManualDuration] = useState('45');
  const [manualQuestions, setManualQuestions] = useState('20');
  const [manualCorrect, setManualCorrect] = useState('16');
  const [manualDifficulty, setManualDifficulty] = useState<StudyDifficulty>('medium');
  const [manualNotes, setManualNotes] = useState('');

  const activeSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

  const subjectSessions = studySessions.filter(s => s.subjectId === activeSubject?.id);
  const subjectNotes = notes.filter(n => n.relatedEntity?.id === activeSubject?.id || n.relatedEntity?.type === 'subject');
  const subjectFiles = files.filter(f => f.relatedSubjectId === activeSubject?.id);
  const subjectSources = sources.filter(s => s.subjectId === activeSubject?.id);

  const formatHoursMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    const created = await createSubject(newSubjectName.trim(), undefined, newSubjectColor);
    setSelectedSubjectId(created.id);
    setNewSubjectName('');
    setIsAddSubjectModalOpen(false);
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !activeSubject) return;

    await addTopic(activeSubject.id, newTopicTitle.trim());

    setNewTopicTitle('');
    setIsAddTopicModalOpen(false);
  };

  const handleSaveManualSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubject) return;

    const attempted = parseInt(manualQuestions, 10) || 0;
    const correct = parseInt(manualCorrect, 10) || 0;
    const actual = parseInt(manualDuration, 10) || 45;

    await recordStudySession({
      subjectId: activeSubject.id,
      topicId: manualTopicId || (activeSubject.topics?.[0]?.id),
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      plannedDuration: actual,
      actualDuration: actual,
      questionsAttempted: attempted,
      questionsCorrect: correct,
      difficulty: manualDifficulty,
      notes: manualNotes.trim() || undefined,
      sourceTitle: `${activeSubject.name} Study Session`,
    });

    setManualNotes('');
    setIsManualSessionModalOpen(false);
  };

  const handleStartTopicTimer = (topic: Topic) => {
    startTimer({
      mode: 'countdown',
      durationMinutes: 45,
      subjectId: activeSubject?.id,
      taskTitle: `${activeSubject?.name}: ${topic.title}`,
    });
  };

  const getTopicBadge = (status: Topic['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="emerald">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="blue">In Progress</Badge>;
      case 'revision':
        return <Badge variant="amber">Revision</Badge>;
      case 'not_started':
        return <Badge variant="neutral">Not Started</Badge>;
    }
  };

  const totalTopics = activeSubject?.topics?.length || 0;
  const completedTopics = activeSubject?.topics?.filter(t => t.status === 'completed').length || 0;
  const syllabusProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Header and Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-md)',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 2px 0' }}>
            Study Management & Curriculum
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Subject analytics, question accuracy, syllabus topics, and session history.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={() => setIsManualSessionModalOpen(true)}>
            <Clock size={15} /> Log Session
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddSubjectModalOpen(true)}>
            <Plus size={15} /> Add Subject
          </button>
        </div>
      </div>

      {/* Subject Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-sm)',
          overflowX: 'auto',
          paddingBottom: 'var(--space-xs)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {subjects.map(subject => {
          const isSelected = subject.id === activeSubject?.id;
          return (
            <button
              key={subject.id}
              onClick={() => setSelectedSubjectId(subject.id)}
              className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '6px 16px',
                border: isSelected ? 'none' : '1px solid var(--border-default)',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: subject.color,
                  marginRight: '6px',
                  display: 'inline-block',
                }}
              />
              {subject.name}
            </button>
          );
        })}
      </div>

      {activeSubject && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Key Subject Analytics Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-md)',
            }}
          >
            {/* Total Study Time */}
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Study Time
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {formatHoursMins(activeSubject.totalStudyMinutes || 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Across {subjectSessions.length} recorded sessions
              </div>
            </div>

            {/* Questions Attempted */}
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Questions Practiced
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {activeSubject.questionsAttempted || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {activeSubject.questionsCorrect || 0} answered correctly
              </div>
            </div>

            {/* Practice Accuracy */}
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Practice Accuracy
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-text)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {activeSubject.accuracyRate || 0}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Based on problem sets
              </div>
            </div>

            {/* Syllabus Coverage */}
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Syllabus Coverage
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success-text)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {syllabusProgress}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {completedTopics}/{totalTopics} topics completed
              </div>
            </div>
          </div>

          {/* Main 2-Column Split */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
              gap: 'var(--space-xl)',
            }}
            className="today-grid"
          >
            {/* Left Column: Topics Breakdown */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  {activeSubject.name} Curriculum & Topics
                </h3>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setIsAddTopicModalOpen(true)}
                >
                  <Plus size={14} /> Add Topic
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeSubject.topics?.map(topic => (
                  <div
                    key={topic.id}
                    className="card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      gap: '12px',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                          #{topic.order}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{topic.title}</span>
                        {getTopicBadge(topic.status)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '10px' }}>
                        <span>Est: {topic.estimatedMinutes}m</span>
                        {topic.questionsAttempted ? (
                          <span>• {topic.questionsCorrect}/{topic.questionsAttempted} Qs ({topic.accuracyRate}%)</span>
                        ) : null}
                      </div>
                    </div>

                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleStartTopicTimer(topic)}
                      title="Start 45m focus session on this topic"
                    >
                      <Play size={13} style={{ marginRight: '3px' }} /> Focus
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Resources & Learning Sources */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              {/* Connected Sources & Files */}
              <div className="card" style={{ padding: 'var(--space-md)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={16} color="var(--accent-text)" />
                  Learning Resources & Sources
                </h4>

                {subjectSources.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    No learning sources attached yet. Manage them in Files & Sources.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {subjectSources.map(s => (
                      <div
                        key={s.id}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: 'var(--bg-input)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.title}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{s.type}</div>
                        </div>
                        {s.url && (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--accent-text)', display: 'flex', alignItems: 'center' }}
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subject Notes */}
              <div className="card" style={{ padding: 'var(--space-md)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} color="var(--accent-text)" />
                  Subject Notes ({subjectNotes.length})
                </h4>

                {subjectNotes.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    No notes recorded for this subject yet.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {subjectNotes.map(n => (
                      <div
                        key={n.id}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: 'var(--bg-input)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{n.title}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {n.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subject Attached Files */}
              <div className="card" style={{ padding: 'var(--space-md)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} color="var(--accent-text)" />
                  Attached Files ({subjectFiles.length})
                </h4>

                {subjectFiles.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    No files attached for this subject yet. Upload PDFs or slides in Files.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {subjectFiles.map(f => (
                      <div
                        key={f.id}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: 'var(--bg-input)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                          {f.name}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                          {(f.size / 1024).toFixed(0)} KB
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Study Session Log History */}
          <div className="card" style={{ padding: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={17} color="var(--accent-text)" />
              Recorded Study Sessions ({subjectSessions.length})
            </h3>

            {subjectSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No sessions completed for this subject yet. Start a focus session above to record your actual study duration and accuracy!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {subjectSessions.map(ses => (
                  <div
                    key={ses.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: 'var(--bg-input)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {ses.sourceTitle || 'Study Session'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {ses.startTime} - {ses.endTime} • Planned: {ses.plannedDuration}m • Actual: {ses.actualDuration}m
                      </div>
                      {ses.notes && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', fontStyle: 'italic' }}>
                          "{ses.notes}"
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {ses.questionsAttempted ? (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-text)' }}>
                            {ses.accuracy}% Accuracy
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {ses.questionsCorrect}/{ses.questionsAttempted} Qs
                          </div>
                        </div>
                      ) : null}

                      <Badge variant={ses.difficulty === 'hard' ? 'red' : ses.difficulty === 'medium' ? 'amber' : 'emerald'}>
                        {ses.difficulty || 'medium'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      <Modal
        isOpen={isAddSubjectModalOpen}
        onClose={() => setIsAddSubjectModalOpen(false)}
        title="Add Academic Subject"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsAddSubjectModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateSubject}>
              Create Subject
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateSubject}>
          <div className="form-group">
            <label className="form-label">Subject Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Organic Chemistry, Mathematics, Machine Learning..."
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Accent Color</label>
            <input
              type="color"
              className="form-input"
              style={{ height: '40px', padding: '4px' }}
              value={newSubjectColor}
              onChange={e => setNewSubjectColor(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Add Topic Modal */}
      <Modal
        isOpen={isAddTopicModalOpen}
        onClose={() => setIsAddTopicModalOpen(false)}
        title={`Add Topic to ${activeSubject?.name}`}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsAddTopicModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAddTopic}>
              Add Topic
            </button>
          </>
        }
      >
        <form onSubmit={handleAddTopic}>
          <div className="form-group">
            <label className="form-label">Topic Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Electromagnetic Induction, Thermodynamics..."
              value={newTopicTitle}
              onChange={e => setNewTopicTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Estimated Mastery Time (Minutes)</label>
            <input
              type="number"
              className="form-input"
              value={newTopicEstimatedMinutes}
              onChange={e => setNewTopicEstimatedMinutes(e.target.value)}
              min="15"
              step="15"
            />
          </div>
        </form>
      </Modal>

      {/* Manual Study Session Log Modal */}
      <Modal
        isOpen={isManualSessionModalOpen}
        onClose={() => setIsManualSessionModalOpen(false)}
        title={`Log Offline Study Session (${activeSubject?.name})`}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsManualSessionModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveManualSession}>
              Save Session Log
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveManualSession}>
          <div className="form-group">
            <label className="form-label">Topic</label>
            <select
              className="form-select"
              value={manualTopicId}
              onChange={e => setManualTopicId(e.target.value)}
            >
              {activeSubject?.topics?.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Actual Duration (Minutes)</label>
              <input
                type="number"
                className="form-input"
                value={manualDuration}
                onChange={e => setManualDuration(e.target.value)}
                min="5"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select
                className="form-select"
                value={manualDifficulty}
                onChange={e => setManualDifficulty(e.target.value as StudyDifficulty)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Questions Attempted</label>
              <input
                type="number"
                className="form-input"
                value={manualQuestions}
                onChange={e => setManualQuestions(e.target.value)}
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Questions Correct</label>
              <input
                type="number"
                className="form-input"
                value={manualCorrect}
                onChange={e => setManualCorrect(e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes & Observations</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Solved 20 PYQ problems, need more practice with integration steps..."
              value={manualNotes}
              onChange={e => setManualNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
