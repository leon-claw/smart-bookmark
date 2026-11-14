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
  extra: Record<string, unknown>;
}

export type PendingChangeType = 'added' | 'modified' | 'deleted';

export interface FieldDiff {
  field: 'title' | 'url' | 'folderId';
  label: string;
  before: string;
  after: string;
}

export interface PendingChange {
  bookmarkId: string;
  type: PendingChangeType;
  bookmark: Bookmark;
  baseline?: Pick<Bookmark, 'title' | 'url' | 'folderId' | 'chromeId'>;
  diffs: FieldDiff[];
}

export type ChromeExtensionStatus = 'connected' | 'disconnected' | 'error';

export type ImportStatus = 'idle' | 'importing' | 'success';

export type SidebarScope =
  | { kind: 'all' }
  | { kind: 'pending' }
  | { kind: 'folder'; folderId: string }
  | { kind: 'tag'; tag: string };
