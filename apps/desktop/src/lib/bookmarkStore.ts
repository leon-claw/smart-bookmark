import type {
  Bookmark,
  FolderNode,
  SidebarScope,
} from './types';

export function getFolderPath(folderId: string, folders: FolderNode[]): string {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const parts: string[] = [];
  let current = byId.get(folderId);
  const guard = new Set<string>();
  while (current && !guard.has(current.id)) {
    guard.add(current.id);
    parts.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return parts.join(' / ') || '未分类';
}

export function getFolderName(folderId: string, folders: FolderNode[]): string {
  return folders.find((f) => f.id === folderId)?.name ?? '未分类';
}

export function getDescendantFolderIds(rootId: string, folders: FolderNode[]): Set<string> {
  const result = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const folder of folders) {
      if (folder.parentId && result.has(folder.parentId) && !result.has(folder.id)) {
        result.add(folder.id);
        added = true;
      }
    }
  }
  return result;
}

export function filterBookmarks(
  bookmarks: Bookmark[],
  folders: FolderNode[],
  scope: SidebarScope,
  query: string,
  pendingIds: Set<string>,
): Bookmark[] {
  const normalizedQuery = query.trim().toLowerCase();

  let scoped = bookmarks;
  if (scope.kind === 'folder') {
    const allowedIds = getDescendantFolderIds(scope.folderId, folders);
    scoped = bookmarks.filter((b) => allowedIds.has(b.folderId));
  } else if (scope.kind === 'tag') {
    scoped = bookmarks.filter((b) => b.tags.includes(scope.tag));
  } else if (scope.kind === 'pending') {
    scoped = bookmarks.filter((b) => pendingIds.has(b.id));
  }

  if (!normalizedQuery) {
    return scoped;
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  return scoped.filter((bookmark) => {
    const folderPath = getFolderPath(bookmark.folderId, folders).toLowerCase();
    const haystack = [
      bookmark.title,
      bookmark.url,
      bookmark.notes,
      bookmark.tags.join(' '),
      folderPath,
    ]
      .join(' ')
      .toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
}

export function collectAllTags(bookmarks: Bookmark[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const bm of bookmarks) {
    for (const tag of bm.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-CN'));
}

export function formatDisplayUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const path = parsed.pathname === '/' ? '' : parsed.pathname;
    return `${parsed.hostname}${path}${parsed.search}`;
  } catch {
    return rawUrl;
  }
}

export function isValidBookmarkUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
