import type { Bookmark, ChromeExtensionStatus, FolderNode, PendingChange } from './types';

export type BookmarkInput = Pick<Bookmark, 'title' | 'url' | 'folderId' | 'tags' | 'notes'>;
export interface Snapshot {
  folders: FolderNode[];
  bookmarks: Bookmark[];
  pending: PendingChange[];
  chromeProfile?: string;
}
export interface ChromeConnection {
  state: ChromeExtensionStatus;
  code: string;
  error?: string;
}

interface BookmarkApi {
  snapshot(): Promise<Snapshot>;
  chromeStatus(): Promise<ChromeConnection>;
  create(data: BookmarkInput): Promise<Bookmark>;
  save(data: BookmarkInput & { id: string }): Promise<Bookmark>;
  remove(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  revert(id: string): Promise<void>;
  import(): Promise<number>;
  writeback(items: PendingChange[]): Promise<{ written: number; errors: string[] }>;
  agent(prompt: string): Promise<{ text: string; matched: string[]; changed: string[] }>;
}
declare global {
  interface Window {
    bookmarkApp: BookmarkApi;
  }
}
export const api = window.bookmarkApp;
