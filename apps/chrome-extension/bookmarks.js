const fields = ['title', 'url', 'parentId'];

export async function writeBookmark(api, change, journal) {
  const { type, baseline, desired, operationId } = change;
  if (type === 'added') {
    const receipt = await journal.get(operationId);
    if (receipt?.node) return receipt.node;
    if (receipt) throw new Error('Chrome 新增结果未知，请先导入核对该书签');
    await journal.set(operationId, { started: true });
    let node;
    try {
      node = await api.create(desired);
    } catch (error) {
      await journal.remove(operationId);
      throw error;
    }
    await journal.set(operationId, { node });
    return node;
  }
  if (type !== 'modified' && type !== 'deleted') throw new Error('不支持的书签操作');
  let current;
  try {
    [current] = await api.get(baseline.id);
  } catch (error) {
    if (!/can't find bookmark|not found|no bookmark/i.test(error.message)) throw error;
  }
  if (!current && type === 'deleted') return null;
  if (!current || !current.url || fields.some(key =>
    current[key] !== baseline[key] && (type === 'deleted' || current[key] !== desired[key])
  )) throw new Error('书签冲突，Chrome 中的书签已经改变');

  if (type === 'deleted') {
    await api.remove(baseline.id);
    return null;
  }
  if (current.parentId !== desired.parentId) {
    current = await api.move(baseline.id, { parentId: desired.parentId });
  }
  if (current.title !== desired.title || current.url !== desired.url) {
    current = await api.update(baseline.id, { title: desired.title, url: desired.url });
  }
  return current;
}
