import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const LOCAL_FOLDER = { id: 'local', name: '本地书签', parentId: null };
const FIELDS = [
  ['title', '标题'],
  ['url', '网址'],
  ['folderId', '文件夹'],
];
const encode = JSON.stringify;
const decode = JSON.parse;
const folderId = (chromeId) => 'chrome:' + chromeId;
const timestamp = () => new Date().toISOString();

function chromeFields(bookmark) {
  const { title, url, folderId } = bookmark;
  return { title, url, folderId };
}

function validate(record, previous) {
  const { title, url, tags, notes, extra } = record;
  if (typeof title !== 'string' || (!title.trim() && title !== previous?.title)) {
    throw new Error('请输入书签标题');
  }
  if (typeof url !== 'string' || (url !== previous?.url && !/^https?:$/.test(URL.parse(url)?.protocol ?? ''))) {
    throw new Error('请输入有效的 HTTP 或 HTTPS 网址');
  }
  if (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string') || typeof notes !== 'string') {
    throw new Error('备注或标签格式无效');
  }
  if (!extra || typeof extra !== 'object' || Array.isArray(extra)) {
    throw new Error('扩展字段必须是对象');
  }
  return { ...record, tags: [...new Set(tags.map(tag => tag.trim()).filter(Boolean))] };
}

function flattenTree(tree) {
  if (!Array.isArray(tree) || !tree.length || !Array.isArray(tree[0]?.children)) {
    throw new Error('Chrome 返回了无效的书签树');
  }
  const folders = [];
  const bookmarks = [];
  const visit = (node, parentId) => {
    if (typeof node.id !== 'string' || typeof node.title !== 'string') {
      throw new Error('Chrome 返回了无效的书签节点');
    }
    if (typeof node.url === 'string') {
      bookmarks.push({ ...node, parentId: node.parentId ?? parentId?.slice(7) });
      return;
    }
    const id = folderId(node.id);
    const { children = [], ...chrome } = node;
    folders.push({ id, name: node.title, parentId, chromeId: node.id, chrome });
    children.forEach(child => visit(child, id));
  };
  tree[0].children.forEach(node => visit(node, null));
  return { folders, bookmarks };
}

export class Library {
  constructor(path) {
    this.db = new DatabaseSync(path, { timeout: 3000 });
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS folders (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY, chrome_id TEXT UNIQUE, data TEXT NOT NULL,
        baseline TEXT, deleted INTEGER NOT NULL DEFAULT 0
      );
    `);
    this.db.prepare('INSERT OR IGNORE INTO folders VALUES (?, ?)').run(LOCAL_FOLDER.id, encode(LOCAL_FOLDER));
  }

  close() {
    this.db.close();
  }

  setting(key) {
    return this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key)?.value;
  }

  setSetting(key, value) {
    this.db.prepare('INSERT OR REPLACE INTO settings VALUES (?, ?)').run(key, value);
  }

  transaction(work) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = work();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  row(id) {
    const row = this.db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id);
    if (!row) throw new Error('书签不存在');
    return row;
  }

  put(record, baseline, deleted = false) {
    this.db.prepare(`
      INSERT INTO bookmarks VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET chrome_id=excluded.chrome_id, data=excluded.data,
      baseline=excluded.baseline, deleted=excluded.deleted
    `).run(record.id, record.chromeId ?? null, encode(record), baseline ? encode(baseline) : null, Number(deleted));
  }

  requireFolder(id) {
    if (typeof id !== 'string' || !this.db.prepare('SELECT id FROM folders WHERE id = ?').get(id)) {
      throw new Error('目标文件夹不存在');
    }
  }

  create(input) {
    const createdAt = timestamp();
    const bookmark = validate({
      id: randomUUID(), title: input.title?.trim(), url: input.url?.trim(),
      folderId: input.folderId ?? LOCAL_FOLDER.id,
      notes: input.notes ?? '', tags: input.tags ?? [], extra: input.extra ?? {},
      createdAt, updatedAt: createdAt,
    });
    this.requireFolder(bookmark.folderId);
    this.put(bookmark, null);
    return bookmark;
  }

  save(input) {
    const row = this.row(input.id);
    if (row.deleted) throw new Error('书签已删除');
    const current = decode(row.data);
    const bookmark = validate({
      ...current,
      title: input.title ?? current.title, url: input.url ?? current.url,
      folderId: input.folderId ?? current.folderId,
      notes: input.notes ?? current.notes, tags: input.tags ?? current.tags,
      extra: input.extra ?? current.extra, updatedAt: timestamp(),
    }, current);
    this.requireFolder(bookmark.folderId);
    this.put(bookmark, row.baseline && decode(row.baseline));
    return bookmark;
  }

  remove(id) {
    this.row(id);
    this.db.prepare('UPDATE bookmarks SET deleted = 1 WHERE id = ?').run(id);
  }

  restore(id) {
    this.row(id);
    this.db.prepare('UPDATE bookmarks SET deleted = 0 WHERE id = ?').run(id);
  }

  revert(id) {
    const row = this.row(id);
    if (!row.baseline) return this.remove(id);
    return this.save({ id, ...decode(row.baseline) });
  }

  snapshot() {
    const folders = this.db.prepare('SELECT data FROM folders').all().map(row => decode(row.data));
    const folderNames = new Map(folders.map(folder => [folder.id, folder.name]));
    const bookmarks = [];
    const pending = [];
    for (const row of this.db.prepare('SELECT * FROM bookmarks ORDER BY rowid').all()) {
      const bookmark = decode(row.data);
      const baseline = row.baseline && decode(row.baseline);
      if (!row.deleted) bookmarks.push(bookmark);
      const diffs = baseline ? FIELDS.filter(([key]) => bookmark[key] !== baseline[key])
        .map(([field, label]) => ({
          field, label,
          before: field === 'folderId' ? folderNames.get(baseline[field]) ?? baseline[field] : baseline[field],
          after: field === 'folderId' ? folderNames.get(bookmark[field]) ?? bookmark[field] : bookmark[field],
        })) : [];
      const type = row.deleted ? baseline && 'deleted' : baseline ? diffs.length && 'modified' : 'added';
      if (type) pending.push({
        bookmarkId: bookmark.id, type, bookmark,
        baseline: baseline ? { ...baseline, chromeId: row.chrome_id } : undefined, diffs,
      });
    }
    return { folders, bookmarks, pending, chromeProfile: this.setting('chromeProfile') };
  }

  importTree(profile, tree) {
    const { folders, bookmarks } = flattenTree(tree);
    return this.transaction(() => {
      const previousProfile = this.setting('chromeProfile');
      if (previousProfile && previousProfile !== profile) throw new Error('请连接首次导入书签的 Chrome 配置');
      this.setSetting('chromeProfile', profile);
      for (const folder of folders) {
        this.db.prepare('INSERT OR REPLACE INTO folders VALUES (?, ?)').run(folder.id, encode(folder));
      }

      const existing = new Map(this.db.prepare('SELECT * FROM bookmarks WHERE chrome_id IS NOT NULL')
        .all().map(row => [row.chrome_id, row]));
      for (const node of bookmarks) {
        const row = existing.get(node.id);
        const current = row && decode(row.data);
        const baseline = row?.baseline && decode(row.baseline);
        const edited = row?.deleted || (baseline && FIELDS.some(([key]) => current[key] !== baseline[key]));
        const imported = {
          title: node.title,
          url: node.url,
          folderId: folderId(node.parentId ?? folders[0]?.chromeId),
        };
        const chromeDate = node.dateAdded ? new Date(node.dateAdded).toISOString() : timestamp();
        const record = {
          id: row?.id ?? randomUUID(),
          chromeId: node.id,
          createdAt: current?.createdAt ?? chromeDate,
          updatedAt: current?.updatedAt ?? chromeDate,
          tags: current?.tags ?? [], notes: current?.notes ?? '', extra: current?.extra ?? {},
          ...(edited ? chromeFields(current) : imported),
          chrome: node,
        };
        this.put(record, edited ? baseline : imported, row?.deleted);
        existing.delete(node.id);
      }

      for (const row of existing.values()) {
        const current = decode(row.data);
        const baseline = row.baseline && decode(row.baseline);
        if (!row.deleted && !FIELDS.some(([key]) => current[key] !== baseline?.[key])) {
          delete current.chromeId;
          delete current.chrome;
          this.put(current, null);
        }
      }
      return bookmarks.length;
    });
  }

  request(change) {
    const folders = this.snapshot().folders;
    const target = folders.find(folder => folder.id === change.bookmark.folderId);
    const defaultFolder = folders.find(folder => folder.chrome?.folderType === 'bookmarks-bar')
      ?? folders.find(folder => folder.chromeId === '1');
    const parentId = target?.chromeId ?? defaultFolder?.chromeId;
    if (change.type !== 'deleted' && !parentId) throw new Error('请先从 Chrome 导入书签以确定写回文件夹');
    const baseline = change.baseline && {
      id: change.baseline.chromeId,
      title: change.baseline.title,
      url: change.baseline.url,
      parentId: folders.find(folder => folder.id === change.baseline.folderId)?.chromeId,
    };
    const desired = change.type !== 'deleted' ? {
      title: change.bookmark.title, url: change.bookmark.url, parentId,
    } : undefined;
    return { type: change.type, operationId: change.bookmarkId, baseline, desired };
  }

  acknowledge(change, node) {
    this.transaction(() => {
      const row = this.row(change.bookmarkId);
      const current = decode(row.data);
      if (!node) {
        delete current.chromeId;
        delete current.chrome;
        this.put(current, null, row.deleted);
        return;
      }
      const duplicate = this.db.prepare('SELECT * FROM bookmarks WHERE chrome_id = ? AND id <> ?').get(node.id, row.id);
      if (duplicate) {
        const imported = decode(duplicate.data);
        const baseline = decode(duplicate.baseline);
        const edited = duplicate.deleted || FIELDS.some(([field]) => imported[field] !== baseline[field]);
        if (edited || imported.notes || imported.tags.length || Object.keys(imported.extra).length) {
          throw new Error('Chrome 书签已重新导入并在本地编辑，请先处理这两条记录');
        }
        this.db.prepare('DELETE FROM bookmarks WHERE id = ?').run(duplicate.id);
      }
      const imported = { title: node.title, url: node.url, folderId: folderId(node.parentId) };
      const folder = current.folderId === change.bookmark.folderId ? imported.folderId : current.folderId;
      this.put({ ...current, chromeId: node.id, chrome: node, folderId: folder }, imported, row.deleted);
    });
  }
}
