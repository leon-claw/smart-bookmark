import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_BOOKMARKS, INITIAL_FOLDERS } from './seedData';
import {
  computePendingChanges,
  filterBookmarks,
  getDescendantFolderIds,
  getFolderPath,
  isValidBookmarkUrl,
  simulateAgentTurn,
} from './bookmarkStore';

test('getFolderPath resolves nested Chrome folder hierarchy', () => {
  const path = getFolderPath('f-sqlite', INITIAL_FOLDERS);
  assert.equal(path, '书签栏 / 技术文档 / 数据库与存储 / SQLite');
});

test('getDescendantFolderIds includes nested child folders', () => {
  const ids = getDescendantFolderIds('f-tech', INITIAL_FOLDERS);
  assert.equal(ids.has('f-tech'), true);
  assert.equal(ids.has('f-db'), true);
  assert.equal(ids.has('f-sqlite'), true);
  assert.equal(ids.has('f-fe'), true);
  assert.equal(ids.has('f-win'), false);
});

test('filterBookmarks searches across title, url, tags, and notes', () => {
  const pending = new Set<string>();
  const byNote = filterBookmarks(
    INITIAL_BOOKMARKS,
    INITIAL_FOLDERS,
    { kind: 'all' },
    'checkpoint',
    pending,
  );
  assert.equal(byNote.length, 1);
  assert.equal(byNote[0].id, 'bm-sqlite-wal');

  const byUrl = filterBookmarks(
    INITIAL_BOOKMARKS,
    INITIAL_FOLDERS,
    { kind: 'all' },
    'fts5.html',
    pending,
  );
  assert.equal(byUrl.length, 1);
  assert.equal(byUrl[0].id, 'bm-sqlite-fts5');

  const empty = filterBookmarks(
    INITIAL_BOOKMARKS,
    INITIAL_FOLDERS,
    { kind: 'all' },
    '完全不存在的关键词xyz',
    pending,
  );
  assert.equal(empty.length, 0);
});

test('computePendingChanges detects added, modified, and deleted items', () => {
  const modified = INITIAL_BOOKMARKS.map((b) =>
    b.id === 'bm-sqlite-wal' ? { ...b, notes: '更新后的本地备注' } : b,
  ).filter((b) => b.id !== 'bm-duckdb');

  modified.push({
    id: 'bm-new-1',
    title: '新添加的本地书签',
    url: 'https://example.com/guide',
    folderId: 'f-inbox',
    tags: ['待读'],
    notes: '',
    createdAt: '2026-11-13 00:40',
    updatedAt: '2026-11-13 00:40',
  });

  const changes = computePendingChanges(INITIAL_BOOKMARKS, modified, INITIAL_FOLDERS);
  assert.equal(changes.length, 3);
  assert.equal(changes.find((c) => c.bookmarkId === 'bm-new-1')?.type, 'added');
  assert.equal(changes.find((c) => c.bookmarkId === 'bm-sqlite-wal')?.type, 'modified');
  assert.equal(changes.find((c) => c.bookmarkId === 'bm-duckdb')?.type, 'deleted');
});

test('simulateAgentTurn handles SQLite doc search and batch tagging without auto-syncing Chrome', () => {
  const step1 = simulateAgentTurn({
    prompt: '查找我收藏的 SQLite 文档',
    bookmarks: INITIAL_BOOKMARKS,
    folders: INITIAL_FOLDERS,
    lastMatchedIds: [],
  });
  assert.equal(step1.assistantMessage.status, 'ok');
  assert.deepEqual(step1.lastMatchedIds, ['bm-sqlite-wal', 'bm-sqlite-fts5']);

  const step2 = simulateAgentTurn({
    prompt: '给这两条书签加上『待读』标签',
    bookmarks: step1.nextBookmarks,
    folders: INITIAL_FOLDERS,
    lastMatchedIds: step1.lastMatchedIds,
  });
  assert.equal(step2.assistantMessage.status, 'ok');
  assert.deepEqual(step2.assistantMessage.action?.updatedBookmarkIds, [
    'bm-sqlite-wal',
    'bm-sqlite-fts5',
  ]);

  const wal = step2.nextBookmarks.find((b) => b.id === 'bm-sqlite-wal');
  const fts5 = step2.nextBookmarks.find((b) => b.id === 'bm-sqlite-fts5');
  assert.equal(wal?.tags.includes('待读'), true);
  assert.equal(fts5?.tags.includes('待读'), true);

  // Pending changes should reflect 2 local edits ready for manual Chrome writeback
  const pending = computePendingChanges(INITIAL_BOOKMARKS, step2.nextBookmarks, INITIAL_FOLDERS);
  assert.equal(pending.length, 2);
});

test('simulateAgentTurn returns error state without mutating bookmarks when failure simulated', () => {
  const result = simulateAgentTurn({
    prompt: '查找我收藏的 SQLite 文档',
    bookmarks: INITIAL_BOOKMARKS,
    folders: INITIAL_FOLDERS,
    lastMatchedIds: [],
    simulateFailure: true,
  });
  assert.equal(result.assistantMessage.status, 'error');
  assert.equal(result.nextBookmarks, INITIAL_BOOKMARKS);
});

test('isValidBookmarkUrl validates http and https URLs strictly', () => {
  assert.equal(isValidBookmarkUrl('https://sqlite.org/wal.html'), true);
  assert.equal(isValidBookmarkUrl('http://localhost:3000'), true);
  assert.equal(isValidBookmarkUrl('not-a-url'), false);
  assert.equal(isValidBookmarkUrl(''), false);
});
