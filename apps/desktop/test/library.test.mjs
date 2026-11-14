import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { Library } from '../main/library.mjs';

const tree = (title = 'SQLite', url = 'https://sqlite.org/') => [{
  id: '0', children: [{ id: '1', title: '书签栏', folderType: 'bookmarks-bar', children: [
    { id: '2', title: '数据库', children: [{ id: '3', title, url, index: 0, dateAdded: 10000 }] },
  ] }],
}];

test('imports Chrome folders and preserves metadata and pending changes on reimport and restart', () => {
  const directory = mkdtempSync(join(tmpdir(), 'smart-bookmark-test-'));
  const path = join(directory, 'bookmarks.sqlite');
  let db = new Library(path);
  try {
    assert.equal(db.importTree('profile', tree()), 1);
    const [row] = db.snapshot().bookmarks;
    assert.equal(db.snapshot().folders.find(f => f.id === row.folderId).name, '数据库');
    db.save({ id: row.id, notes: 'checkpoint', tags: ['数据库'], extra: { rating: 3 } });
    assert.equal(db.snapshot().pending.length, 0);
    db.save({ id: row.id, title: 'SQLite 文档' });
    db.importTree('profile', tree('SQLite in Chrome', 'https://sqlite.org/docs.html'));
    db.close();
    db = new Library(path);
    const { bookmarks, pending } = db.snapshot();
    assert.equal(bookmarks.length, 1);
    assert.equal(bookmarks[0].title, 'SQLite 文档');
    assert.equal(bookmarks[0].notes, 'checkpoint');
    assert.deepEqual(bookmarks[0].extra, { rating: 3 });
    assert.equal(pending[0].baseline.title, 'SQLite');
    assert.throws(() => db.importTree('other', tree()), /Chrome/);
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('records Chrome acknowledgments without discarding later local changes', () => {
  const db = new Library(':memory:');
  try {
    db.importTree('profile', tree());
    const row = db.create({ title: 'A', url: 'https://example.org/' });
    const [change] = db.snapshot().pending;
    db.save({ id: row.id, title: 'B' });
    db.acknowledge(change, { id: '4', title: 'A', url: row.url, parentId: '1' });
    assert.equal(db.snapshot().pending[0].type, 'modified');
    assert.equal(db.snapshot().bookmarks.find(b => b.id === row.id).title, 'B');
    db.remove(row.id);
    const [deleted] = db.snapshot().pending;
    assert.equal(deleted.type, 'deleted');
    db.restore(row.id);
    assert.equal(db.snapshot().bookmarks.find(b => b.id === row.id).title, 'B');
    db.remove(row.id);
    db.acknowledge(deleted, null);
    assert.equal(db.snapshot().pending.length, 0);
  } finally {
    db.close();
  }
});

test('requires a URL on create and reconciles an imported writeback receipt', () => {
  const db = new Library(':memory:');
  try {
    assert.throws(() => db.create({ title: 'Missing URL' }), /网址/);
    db.importTree('profile', tree());
    const local = db.create({ title: 'Local', url: 'https://example.org/', notes: 'keep' });
    const [change] = db.snapshot().pending;
    const node = { id: '4', title: 'Local', url: local.url, parentId: '1' };
    const remote = tree();
    remote[0].children[0].children.push(node);
    db.importTree('profile', remote);
    db.acknowledge(change, node);
    assert.equal(db.snapshot().bookmarks.filter(bookmark => bookmark.chromeId === '4').length, 1);
    assert.equal(db.snapshot().bookmarks.find(bookmark => bookmark.chromeId === '4').notes, 'keep');
  } finally {
    db.close();
  }
});
