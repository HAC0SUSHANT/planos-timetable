import type { Note } from '../types';
import { LocalStorageClient } from './storage';
import { getInitialNotes } from './initialData';

const NOTES_STORAGE_KEY = 'ape_notes_v1';

export interface INoteRepository {
  getAll(): Promise<Note[]>;
  getById(id: string): Promise<Note | null>;
  getByEntity(entityType: string, entityId: string): Promise<Note[]>;
  create(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note>;
  update(id: string, updates: Partial<Note>): Promise<Note>;
  delete(id: string): Promise<boolean>;
}

export class LocalNoteRepository implements INoteRepository {
  private getNotes(): Note[] {
    const stored = LocalStorageClient.get<Note[] | null>(NOTES_STORAGE_KEY, null);
    if (!stored || stored.length === 0) {
      const initial = getInitialNotes();
      LocalStorageClient.set(NOTES_STORAGE_KEY, initial);
      return initial;
    }
    return stored;
  }

  private saveNotes(notes: Note[]): void {
    LocalStorageClient.set(NOTES_STORAGE_KEY, notes);
  }

  async getAll(): Promise<Note[]> {
    return this.getNotes().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getById(id: string): Promise<Note | null> {
    return this.getNotes().find(n => n.id === id) || null;
  }

  async getByEntity(entityType: string, entityId: string): Promise<Note[]> {
    return this.getNotes().filter(
      n => n.relatedEntity && n.relatedEntity.type === entityType && n.relatedEntity.id === entityId
    );
  }

  async create(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const notes = this.getNotes();
    const now = new Date().toISOString();
    const newNote: Note = {
      ...note,
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    notes.unshift(newNote);
    this.saveNotes(notes);
    return newNote;
  }

  async update(id: string, updates: Partial<Note>): Promise<Note> {
    const notes = this.getNotes();
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) throw new Error(`Note ${id} not found`);

    const updated: Note = {
      ...notes[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    notes[idx] = updated;
    this.saveNotes(notes);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const notes = this.getNotes();
    const filtered = notes.filter(n => n.id !== id);
    if (filtered.length !== notes.length) {
      this.saveNotes(filtered);
      return true;
    }
    return false;
  }
}

export { LocalNoteRepository as NoteRepository };
