import type { LearningFile, LearningSource } from '../types';
import { LocalStorageClient } from './storage';
import { getInitialFiles, getInitialSources } from './initialData';

const FILES_STORAGE_KEY = 'ape_files_v1';
const SOURCES_STORAGE_KEY = 'ape_sources_v1';

export interface IFileRepository {
  getAllFiles(): Promise<LearningFile[]>;
  createFile(file: Omit<LearningFile, 'id'>): Promise<LearningFile>;
  deleteFile(id: string): Promise<boolean>;
  getAllSources(): Promise<LearningSource[]>;
  createSource(source: Omit<LearningSource, 'id' | 'createdAt'>): Promise<LearningSource>;
  deleteSource(id: string): Promise<boolean>;
}

export class LocalFileRepository implements IFileRepository {
  private getFiles(): LearningFile[] {
    const stored = LocalStorageClient.get<LearningFile[] | null>(FILES_STORAGE_KEY, null);
    if (!stored || stored.length === 0) {
      const initial = getInitialFiles();
      LocalStorageClient.set(FILES_STORAGE_KEY, initial);
      return initial;
    }
    return stored;
  }

  private saveFiles(files: LearningFile[]): void {
    LocalStorageClient.set(FILES_STORAGE_KEY, files);
  }

  private getSources(): LearningSource[] {
    const stored = LocalStorageClient.get<LearningSource[] | null>(SOURCES_STORAGE_KEY, null);
    if (!stored || stored.length === 0) {
      const initial = getInitialSources();
      LocalStorageClient.set(SOURCES_STORAGE_KEY, initial);
      return initial;
    }
    return stored;
  }

  private saveSources(sources: LearningSource[]): void {
    LocalStorageClient.set(SOURCES_STORAGE_KEY, sources);
  }

  async getAllFiles(): Promise<LearningFile[]> {
    return this.getFiles();
  }

  async createFile(file: Omit<LearningFile, 'id'>): Promise<LearningFile> {
    const files = this.getFiles();
    const newFile: LearningFile = {
      ...file,
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    files.unshift(newFile);
    this.saveFiles(files);
    return newFile;
  }

  async deleteFile(id: string): Promise<boolean> {
    const files = this.getFiles();
    const filtered = files.filter(f => f.id !== id);
    if (filtered.length !== files.length) {
      this.saveFiles(filtered);
      return true;
    }
    return false;
  }

  async getAllSources(): Promise<LearningSource[]> {
    return this.getSources();
  }

  async createSource(source: Omit<LearningSource, 'id' | 'createdAt'>): Promise<LearningSource> {
    const sources = this.getSources();
    const newSource: LearningSource = {
      ...source,
      id: `src-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    sources.unshift(newSource);
    this.saveSources(sources);
    return newSource;
  }

  async deleteSource(id: string): Promise<boolean> {
    const sources = this.getSources();
    const filtered = sources.filter(s => s.id !== id);
    if (filtered.length !== sources.length) {
      this.saveSources(filtered);
      return true;
    }
    return false;
  }
}

export { LocalFileRepository as FileRepository };
