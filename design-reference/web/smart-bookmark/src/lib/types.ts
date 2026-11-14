export interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  folderId: string;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  chromeId?: string;
}

export type PendingChangeType = 'added' | 'modified' | 'deleted';

export interface FieldDiff {
  field: 'title' | 'url' | 'folderId' | 'tags' | 'notes';
  label: string;
  before: string;
  after: string;
}

export interface PendingChange {
  bookmarkId: string;
  type: PendingChangeType;
  bookmark: Bookmark;
  baseline?: Bookmark;
  diffs: FieldDiff[];
}

export type ChromeExtensionStatus = 'connected' | 'disconnected' | 'error';

export type ImportStatus = 'idle' | 'importing' | 'success';

export type WritebackStatus = 'idle' | 'writing' | 'success' | 'failed';

export type SidebarScope =
  | { kind: 'all' }
  | { kind: 'pending' }
  | { kind: 'folder'; folderId: string }
  | { kind: 'tag'; tag: string };

export interface AgentActionSummary {
  type: 'search' | 'tag_update';
  matchedBookmarkIds: string[];
  updatedBookmarkIds?: string[];
  addedTag?: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  status?: 'ok' | 'error';
  errorDetail?: string;
  retryPrompt?: string;
  action?: AgentActionSummary;
}
