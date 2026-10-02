import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { LearningSourceType } from '../types';
import {
  FolderArchive,
  Upload,
  Plus,
  Trash2,
  ExternalLink,
  File,
  FileText,
  Image,
  BookOpen,
  Video,
  Globe,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';

export const FilesView: React.FC = () => {
  const { files, sources, subjects, createFile, deleteFile, createSource, deleteSource } = useApp();

  const [activeTab, setActiveTab] = useState<'files' | 'sources'>('files');
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // New Source form state
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceType, setSourceType] = useState<LearningSourceType>('documentation');
  const [sourceDesc, setSourceDesc] = useState('');
  const [sourceSubjectId, setSourceSubjectId] = useState('');
  const [sourceTags, setSourceTags] = useState('');

  // Handle client-side file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    for (let i = 0; i < uploadedFiles.length; i++) {
      const f = uploadedFiles[i];
      const nowIso = new Date().toISOString();
      await createFile({
        name: f.name,
        mimeType: f.type || 'application/octet-stream',
        type: f.type || 'application/octet-stream',
        size: f.size,
        uploadDate: nowIso,
        uploadedAt: nowIso,
        relatedSubjectId: selectedSubjectFilter !== 'all' ? selectedSubjectFilter : undefined,
        tags: [f.name.split('.').pop() || 'file'],
      });
    }

    // Reset input
    e.target.value = '';
  };

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTitle.trim() || !sourceUrl.trim()) return;

    const tags = sourceTags
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    await createSource({
      title: sourceTitle.trim(),
      url: sourceUrl.trim(),
      type: sourceType,
      description: sourceDesc.trim() || undefined,
      subjectId: sourceSubjectId || undefined,
      tags,
    });

    setSourceTitle('');
    setSourceUrl('');
    setSourceDesc('');
    setSourceSubjectId('');
    setSourceTags('');
    setIsAddSourceModalOpen(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText size={20} color="#EF4444" />;
    if (mimeType.includes('image')) return <Image size={20} color="#3B82F6" />;
    if (mimeType.includes('text') || mimeType.includes('csv')) return <FileText size={20} color="#10B981" />;
    return <File size={20} color="var(--text-muted)" />;
  };

  const getSourceIcon = (type: LearningSourceType) => {
    switch (type) {
      case 'youtube':
        return <Video size={18} color="#EF4444" />;
      case 'documentation':
      case 'article':
        return <FileText size={18} color="#3B82F6" />;
      case 'course':
      case 'book':
        return <BookOpen size={18} color="#8B5CF6" />;
      default:
        return <Globe size={18} color="#10B981" />;
    }
  };

  const filteredFiles = files.filter(f =>
    selectedSubjectFilter === 'all' ? true : f.relatedSubjectId === selectedSubjectFilter
  );

  const filteredSources = sources.filter(s =>
    selectedSubjectFilter === 'all' ? true : s.subjectId === selectedSubjectFilter
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Top Header */}
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
            Files & Learning Sources
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Curate textbooks, question PDFs, formula sheets, documentation, and online courses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {activeTab === 'files' ? (
            <label className="btn btn-primary" style={{ cursor: 'pointer', margin: 0 }}>
              <Upload size={15} /> Upload Files
              <input
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </label>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsAddSourceModalOpen(true)}>
              <Plus size={15} /> Add Learning Source
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Subject Filter */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-md)',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 'var(--space-sm)',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'files' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '5px 16px' }}
            onClick={() => setActiveTab('files')}
          >
            Attached Files ({files.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'sources' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '5px 16px' }}
            onClick={() => setActiveTab('sources')}
          >
            Learning Sources ({sources.length})
          </button>
        </div>

        {/* Filter by Subject */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Subject Filter:</span>
          <select
            className="form-select"
            style={{ padding: '4px 10px', fontSize: '0.8rem', width: 'auto' }}
            value={selectedSubjectFilter}
            onChange={e => setSelectedSubjectFilter(e.target.value)}
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: FILES */}
      {activeTab === 'files' && (
        <div>
          {filteredFiles.length === 0 ? (
            <EmptyState
              icon={<FolderArchive size={28} />}
              title="No files attached"
              description="Upload lecture slides, problem sheets, or formula sheets to keep your study materials organized."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
              {filteredFiles.map(file => {
                const sub = subjects.find(s => s.id === file.relatedSubjectId);
                return (
                  <div
                    key={file.id}
                    className="card"
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ marginTop: '2px' }}>{getFileIcon(file.mimeType || file.type || '')}</div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            margin: 0,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={file.name}
                        >
                          {file.name}
                        </h4>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {formatFileSize(file.size)} • {(file.uploadDate || file.uploadedAt || '').split('T')[0] || 'Recently'}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '6px',
                        fontSize: '0.75rem',
                      }}
                    >
                      {sub ? (
                        <span style={{ color: sub.color, fontWeight: 600 }}>• {sub.name}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>General</span>
                      )}

                      <button
                        className="btn-icon"
                        style={{ color: 'var(--danger-text)', padding: '2px' }}
                        onClick={() => deleteFile(file.id)}
                        title="Delete file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LEARNING SOURCES */}
      {activeTab === 'sources' && (
        <div>
          {filteredSources.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={28} />}
              title="No learning sources added"
              description="Add YouTube playlists, official docs, textbook links, and course lectures."
              actionText="Add Source"
              onAction={() => setIsAddSourceModalOpen(true)}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
              {filteredSources.map(source => {
                const sub = subjects.find(s => s.id === source.subjectId);
                return (
                  <div
                    key={source.id}
                    className="card"
                    style={{
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {getSourceIcon(source.type)}
                          <span style={{ fontSize: '0.75rem', textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-muted)' }}>
                            {source.type}
                          </span>
                        </div>
                        {sub && (
                          <span style={{ fontSize: '0.72rem', color: sub.color, fontWeight: 600 }}>
                            {sub.name}
                          </span>
                        )}
                      </div>

                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                        {source.title}
                      </h4>

                      {source.description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                          {source.description}
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '8px',
                      }}
                    >
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.75rem', textDecoration: 'none' }}
                      >
                        Visit Source <ExternalLink size={12} style={{ marginLeft: '4px' }} />
                      </a>

                      <button
                        className="btn-icon"
                        style={{ color: 'var(--danger-text)', padding: '2px' }}
                        onClick={() => deleteSource(source.id)}
                        title="Delete source"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Learning Source Modal */}
      <Modal
        isOpen={isAddSourceModalOpen}
        onClose={() => setIsAddSourceModalOpen(false)}
        title="Add Learning Source"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsAddSourceModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateSource}>
              Save Source
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateSource}>
          <div className="form-group">
            <label className="form-label">Source Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 3Blue1Brown Essence of Calculus, NCERT Physics..."
              value={sourceTitle}
              onChange={e => setSourceTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Resource URL *</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://..."
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Source Type</label>
              <select
                className="form-select"
                value={sourceType}
                onChange={e => setSourceType(e.target.value as LearningSourceType)}
              >
                <option value="youtube">YouTube / Video</option>
                <option value="documentation">Documentation / Reference</option>
                <option value="course">Online Course</option>
                <option value="book">Book / Textbook</option>
                <option value="article">Article / Blog</option>
                <option value="website">Website / Practice Platform</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Subject</label>
              <select
                className="form-select"
                value={sourceSubjectId}
                onChange={e => setSourceSubjectId(e.target.value)}
              >
                <option value="">-- General / Multi-subject --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Study Notes</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Best chapter for conceptual Gauss Law intuition..."
              value={sourceDesc}
              onChange={e => setSourceDesc(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. video, intuition, calculus"
              value={sourceTags}
              onChange={e => setSourceTags(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
