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
export interface AgentProfile {
  provider: 'openai' | 'anthropic' | 'compatible';
  modelId: string;
  baseUrl: string;
}
export interface AgentSettings extends AgentProfile {
  hasKey: boolean;
  ready: boolean;
}
export type AgentSettingsInput = AgentProfile & { apiKey?: string; clearKey?: boolean };

export const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error))
  .replace(/^Error invoking remote method '[^']+': Error: /, '');

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
  agentSettings(): Promise<AgentSettings>;
  saveAgentSettings(input: AgentSettingsInput): Promise<AgentSettings>;
  testAgentSettings(input: AgentSettingsInput): Promise<void>;
}
declare global {
  interface Window {
    bookmarkApp: BookmarkApi;
  }
}
export const api = window.bookmarkApp;
