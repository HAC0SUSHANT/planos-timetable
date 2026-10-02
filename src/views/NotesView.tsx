import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Note, NoteRelatedEntity, NoteEntityType } from '../types';
import { FileText, Plus, Search, Edit3, Trash2, BookOpen, Target, CheckSquare } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';

export const NotesView: React.FC = () => {
  const { notes, subjects, goals, tasks, createNote, updateNote, deleteNote } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'subject' | 'goal' | 'task' | 'general'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [entityType, setEntityType] = useState<'none' | NoteEntityType>('none');
  const [selectedEntityId, setSelectedEntityId] = useState('');

  const handleOpenCreate = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setTagsInput('');
    setEntityType('none');
    setSelectedEntityId('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setTagsInput((note.tags || []).join(', '));
    setEntityType(note.relatedEntity?.type || 'none');
    setSelectedEntityId(note.relatedEntity?.id || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    let relatedEntity: NoteRelatedEntity | undefined;
    if (entityType !== 'none' && selectedEntityId) {
      relatedEntity = {
        type: entityType,
        id: selectedEntityId,
      };
    }

    if (editingNote) {
      await updateNote(editingNote.id, {
        title: title.trim(),
        content: content.trim(),
        tags,
        relatedEntity,
      });
    } else {
      await createNote({
        title: title.trim(),
        content: content.trim(),
        tags,
        relatedEntity,
      });
    }

    setIsModalOpen(false);
  };

  // Filter notes
  const filteredNotes = notes.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'general') return !n.relatedEntity;
    return n.relatedEntity?.type === filterType;
  });

  const getEntityLabel = (entity?: NoteRelatedEntity) => {
    if (!entity) return null;
    if (entity.type === 'subject') {
      const sub = subjects.find(s => s.id === entity.id);
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-text)' }}>
          <BookOpen size={12} /> {sub ? sub.name : 'Subject'}
        </span>
      );
    }
    if (entity.type === 'goal') {
      const g = goals.find(goal => goal.id === entity.id);
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10B981' }}>
          <Target size={12} /> {g ? g.name : 'Goal'}
        </span>
      );
    }
    if (entity.type === 'task') {
      const t = tasks.find(task => task.id === entity.id);
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#F59E0B' }}>
          <CheckSquare size={12} /> {t ? t.title : 'Task'}
        </span>
      );
    }
    return null;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Header */}
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
            Notes & Knowledge Repository
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Contextual study notes linked to subjects, milestones, tasks, or freeform takeaways.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> New Note
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-md)',
        }}
      >
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            className="form-input"
            style={{ border: 'none', backgroundColor: 'transparent', padding: '4px 0' }}
            placeholder="Search notes by keyword or #tag..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {(['all', 'subject', 'goal', 'task', 'general'] as const).map(type => (
            <button
              key={type}
              className={`btn btn-sm ${filterType === type ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', padding: '4px 10px', fontSize: '0.78rem', textTransform: 'capitalize' }}
              onClick={() => setFilterType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid or Empty State */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={<FileText size={28} />}
          title="No notes found"
          description={searchQuery ? 'Try adjusting your search query or filter.' : 'Capture your first note or formula takeaway.'}
          actionText="Create Note"
          onAction={handleOpenCreate}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--space-md)',
          }}
        >
          {filteredNotes.map(note => (
            <div
              key={note.id}
              className="card"
              style={{
                padding: 'var(--space-md)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 'var(--space-md)',
                height: '100%',
              }}
            >
              <div>
                {/* Header: Connected Entity & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    {getEntityLabel(note.relatedEntity) || (
                      <span style={{ color: 'var(--text-muted)' }}>General Note</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button
                      className="btn-icon"
                      style={{ padding: '3px' }}
                      onClick={() => handleOpenEdit(note)}
                      title="Edit note"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="btn-icon"
                      style={{ padding: '3px', color: 'var(--danger-text)' }}
                      onClick={() => deleteNote(note.id)}
                      title="Delete note"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  {note.title}
                </h4>

                {/* Content */}
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    margin: 0,
                  }}
                >
                  {note.content}
                </p>
              </div>

              {/* Footer: Tags & Date */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                {note.tags && note.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                    {note.tags.map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.7rem',
                          backgroundColor: 'var(--bg-input)',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {new Date(note.updatedAt || note.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Note Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNote ? 'Edit Note' : 'Create New Note'}
        maxWidth="580px"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Save Note
            </button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Gauss Law & Spherical Shell formulas..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Note Content *</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '140px' }}
              placeholder="Type takeaways, problem observations, derivation steps, formulas..."
              value={content}
              onChange={e => setContent(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Link Entity</label>
              <select
                className="form-select"
                value={entityType}
                onChange={e => {
                  const val = e.target.value as any;
                  setEntityType(val);
                  setSelectedEntityId('');
                }}
              >
                <option value="none">-- General / No Entity --</option>
                <option value="subject">Subject</option>
                <option value="goal">Goal</option>
                <option value="task">Task</option>
              </select>
            </div>

            {entityType === 'subject' && (
              <div className="form-group">
                <label className="form-label">Select Subject</label>
                <select
                  className="form-select"
                  value={selectedEntityId}
                  onChange={e => setSelectedEntityId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {entityType === 'goal' && (
              <div className="form-group">
                <label className="form-label">Select Goal</label>
                <select
                  className="form-select"
                  value={selectedEntityId}
                  onChange={e => setSelectedEntityId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Goal --</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            {entityType === 'task' && (
              <div className="form-group">
                <label className="form-label">Select Task</label>
                <select
                  className="form-select"
                  value={selectedEntityId}
                  onChange={e => setSelectedEntityId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Task --</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. physics, formulas, pyqs, review"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
