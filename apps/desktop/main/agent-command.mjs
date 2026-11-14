export function runBookmarkCommand(library, command, activity = { matched: new Set(), changed: new Set() }) {
  const match = /^bookmark (find|add|update|delete) (\{[\s\S]*\})$/.exec(command.trim());
  if (!match) throw new Error('使用 bookmark <find|add|update|delete> {JSON}，每次调用只允许一条命令');
  const [, verb, json] = match;
  let data;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('参数必须是有效 JSON');
  }
  if (verb === 'find') {
    const { bookmarks, folders } = library.snapshot();
    const byId = new Map(folders.map(folder => [folder.id, folder]));
    const query = String(data.query ?? '').toLowerCase().trim().split(/\s+/).filter(Boolean);
    const items = bookmarks.filter(bookmark => {
      if (data.id && data.id !== bookmark.id) return false;
      const parts = [bookmark.title, bookmark.url, bookmark.notes, ...bookmark.tags];
      let folder = byId.get(bookmark.folderId);
      const visited = new Set();
      while (folder && !visited.has(folder.id)) {
        visited.add(folder.id);
        parts.push(folder.name);
        folder = byId.get(folder.parentId);
      }
      const text = parts.join(' ').toLowerCase();
      return query.every(word => text.includes(word));
    });
    const offset = Math.max(0, Number.isSafeInteger(data.offset) ? data.offset : 0);
    const page = items.slice(offset, offset + 25).map(({ id, title, url, folderId, tags, notes }) =>
      ({ id, title, url, folderId, tags, notes }));
    page.forEach(bookmark => activity.matched.add(bookmark.id));
    return { total: items.length, items: page, folders: folders.map(({ id, name, parentId }) => ({ id, name, parentId })) };
  }

  let bookmark;
  if (verb === 'add') {
    bookmark = library.create(data);
  } else {
    if (typeof data.id !== 'string') throw new Error('请提供书签 ID');
    const previous = library.snapshot().bookmarks.find(item => item.id === data.id);
    if (!previous) throw new Error('书签不存在');
    if (verb === 'delete') {
      library.remove(data.id);
      activity.changed.add(previous.id);
      return { id: previous.id, title: previous.title, deleted: true };
    }
    if (data.addTags !== undefined) {
      if (!Array.isArray(data.addTags)) throw new Error('addTags 必须为数组');
      data.tags = [...(data.tags ?? previous.tags), ...data.addTags];
    }
    bookmark = library.save(data);
  }
  activity.changed.add(bookmark.id);
  const { id, title, url, folderId, tags, notes } = bookmark;
  return { id, title, url, folderId, tags, notes };
}
