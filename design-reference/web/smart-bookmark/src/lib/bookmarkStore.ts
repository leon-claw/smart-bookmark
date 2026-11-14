import type {
  AgentMessage,
  Bookmark,
  FieldDiff,
  FolderNode,
  PendingChange,
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

export function computeBookmarkDiffs(
  baseline: Bookmark,
  current: Bookmark,
  folders: FolderNode[],
): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  if (baseline.title !== current.title) {
    diffs.push({
      field: 'title',
      label: '标题',
      before: baseline.title,
      after: current.title,
    });
  }
  if (baseline.url !== current.url) {
    diffs.push({
      field: 'url',
      label: '网址',
      before: baseline.url,
      after: current.url,
    });
  }
  if (baseline.folderId !== current.folderId) {
    diffs.push({
      field: 'folderId',
      label: '文件夹',
      before: getFolderPath(baseline.folderId, folders),
      after: getFolderPath(current.folderId, folders),
    });
  }
  const baseTags = [...baseline.tags].sort().join(', ');
  const currTags = [...current.tags].sort().join(', ');
  if (baseTags !== currTags) {
    diffs.push({
      field: 'tags',
      label: '标签',
      before: baseline.tags.join(' · ') || '（无）',
      after: current.tags.join(' · ') || '（无）',
    });
  }
  if (baseline.notes !== current.notes) {
    diffs.push({
      field: 'notes',
      label: '备注',
      before: baseline.notes || '（空）',
      after: current.notes || '（空）',
    });
  }
  return diffs;
}

export function computePendingChanges(
  baselineBookmarks: Bookmark[],
  localBookmarks: Bookmark[],
  folders: FolderNode[],
): PendingChange[] {
  const baselineById = new Map(baselineBookmarks.map((b) => [b.id, b]));
  const localById = new Map(localBookmarks.map((b) => [b.id, b]));
  const changes: PendingChange[] = [];

  for (const local of localBookmarks) {
    const base = baselineById.get(local.id);
    if (!base) {
      changes.push({
        bookmarkId: local.id,
        type: 'added',
        bookmark: local,
        diffs: [],
      });
    } else {
      const diffs = computeBookmarkDiffs(base, local, folders);
      if (diffs.length > 0) {
        changes.push({
          bookmarkId: local.id,
          type: 'modified',
          bookmark: local,
          baseline: base,
          diffs,
        });
      }
    }
  }

  for (const base of baselineBookmarks) {
    if (!localById.has(base.id)) {
      changes.push({
        bookmarkId: base.id,
        type: 'deleted',
        bookmark: base,
        baseline: base,
        diffs: [],
      });
    }
  }

  return changes;
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

export function nowStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function timeShort(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface AgentTurnResult {
  assistantMessage: AgentMessage;
  nextBookmarks: Bookmark[];
  lastMatchedIds: string[];
}

export function simulateAgentTurn(params: {
  prompt: string;
  bookmarks: Bookmark[];
  folders: FolderNode[];
  lastMatchedIds: string[];
  simulateFailure?: boolean;
}): AgentTurnResult {
  const { prompt, bookmarks, folders, lastMatchedIds, simulateFailure } = params;
  const trimmed = prompt.trim();
  const timestamp = timeShort();

  if (simulateFailure) {
    return {
      assistantMessage: {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: 'Agent 请求失败：本地模型服务响应超时，未能完成本次书签检索或整理。',
        timestamp,
        status: 'error',
        errorDetail: 'ERR_AGENT_TIMEOUT: 本地推理服务未在 5000ms 内返回结果，本地书签未被改动。',
        retryPrompt: trimmed,
      },
      nextBookmarks: bookmarks,
      lastMatchedIds,
    };
  }

  // Case 1: Tagging previously matched or referenced bookmarks (e.g. "给这两条书签加上『待读』标签")
  const tagMatch = trimmed.match(/[『「"']([^』」"']+)[』」"']/);
  const wantsAddTag =
    /加上|添加|打上|标记/.test(trimmed) && (/标签/.test(trimmed) || Boolean(tagMatch));

  if (wantsAddTag) {
    const tagToAdd = tagMatch?.[1]?.trim() || '待读';
    let targetIds = lastMatchedIds.filter((id) => bookmarks.some((b) => b.id === id));

    if (targetIds.length === 0) {
      // Fallback: try matching SQLite docs if user jumped directly to tagging
      targetIds = bookmarks
        .filter(
          (b) =>
            b.title.toLowerCase().includes('sqlite') &&
            (b.tags.includes('文档') || b.title.includes('文档') || b.title.includes('手册')),
        )
        .map((b) => b.id);
    }

    if (targetIds.length === 0) {
      return {
        assistantMessage: {
          id: `msg-asst-${Date.now()}`,
          role: 'assistant',
          content: `没有找到需要先标记的目标书签。请先让我查找一批书签（例如「查找我收藏的 SQLite 文档」），再批量添加「${tagToAdd}」标签。`,
          timestamp,
          status: 'ok',
        },
        nextBookmarks: bookmarks,
        lastMatchedIds,
      };
    }

    const updatedSet = new Set(targetIds);
    const stamp = nowStamp();
    const nextBookmarks = bookmarks.map((bm) => {
      if (!updatedSet.has(bm.id)) return bm;
      if (bm.tags.includes(tagToAdd)) return bm;
      return {
        ...bm,
        tags: [...bm.tags, tagToAdd],
        updatedAt: stamp,
      };
    });

    return {
      assistantMessage: {
        id: `msg-asst-${Date.now()}`,
        role: 'assistant',
        content: `已为这 ${targetIds.length} 条书签添加「${tagToAdd}」标签并保存到本地。如需同步到浏览器，请在顶部点击「写回 Chrome」。`,
        timestamp,
        status: 'ok',
        action: {
          type: 'tag_update',
          matchedBookmarkIds: targetIds,
          updatedBookmarkIds: targetIds,
          addedTag: tagToAdd,
        },
      },
      nextBookmarks,
      lastMatchedIds: targetIds,
    };
  }

  // Case 2: Search query — handle SQLite docs specifically and general natural language search
  let queryTerms: string[] = [];
  if (/sqlite/i.test(trimmed)) {
    queryTerms = ['sqlite'];
    if (/文档|手册/.test(trimmed)) {
      // Prefer SQLite docs
      const sqliteDocs = bookmarks.filter((b) => {
        const primaryText = `${b.title} ${b.url} ${b.tags.join(' ')} ${getFolderPath(b.folderId, folders)}`.toLowerCase();
        return primaryText.includes('sqlite') && (primaryText.includes('文档') || primaryText.includes('手册') || b.url.includes('sqlite.org'));
      });
      const matchedIds = sqliteDocs.map((b) => b.id);
      return {
        assistantMessage: {
          id: `msg-asst-${Date.now()}`,
          role: 'assistant',
          content:
            matchedIds.length > 0
              ? `共找到 ${matchedIds.length} 条你收藏的 SQLite 官方文档书签，均位于「技术文档 / 数据库与存储 / SQLite」文件夹：`
              : '没有找到与 SQLite 文档匹配的书签。',
          timestamp,
          status: 'ok',
          action: {
            type: 'search',
            matchedBookmarkIds: matchedIds,
          },
        },
        nextBookmarks: bookmarks,
        lastMatchedIds: matchedIds,
      };
    }
  } else {
    // Strip common Chinese command filler words to extract search keywords
    const cleaned = trimmed
      .replace(/查找|搜索|帮我|找出|我收藏的|关于|的书签|书签|文档|资料|有哪些|请|显示/g, ' ')
      .trim();
    queryTerms = cleaned
      .split(/\s+/)
      .map((t) => t.toLowerCase())
      .filter((t) => t.length > 0);
  }

  const matched =
    queryTerms.length > 0
      ? bookmarks.filter((b) => {
          const text = `${b.title} ${b.url} ${b.tags.join(' ')} ${b.notes} ${getFolderPath(b.folderId, folders)}`.toLowerCase();
          return queryTerms.every((term) => text.includes(term));
        })
      : [];

  const matchedIds = matched.map((b) => b.id);

  return {
    assistantMessage: {
      id: `msg-asst-${Date.now()}`,
      role: 'assistant',
      content:
        matchedIds.length > 0
          ? `共找到 ${matchedIds.length} 条相关书签：`
          : `在本地书签库中未找到与「${trimmed}」匹配的内容。你可以换个关键词，或在主界面搜索框直接检索标题、网址与备注。`,
      timestamp,
      status: 'ok',
      action: {
        type: 'search',
        matchedBookmarkIds: matchedIds,
      },
    },
    nextBookmarks: bookmarks,
    lastMatchedIds: matchedIds,
  };
}
