import assert from 'node:assert/strict';
import { test } from 'node:test';
import { writeBookmark } from './bookmarks.js';

test('checks Chrome conflicts and resumes an interrupted move plus update', async () => {
  let node = { id: '3', parentId: '1', title: 'Old', url: 'https://example.org/' };
  const api = {
    get: async (id) => id === '3' && node ? [node] : [],
    move: async (id, { parentId }) => (node = { ...node, parentId }),
    update: async (id, fields) => (node = { ...node, ...fields }),
    remove: async () => { node = null; },
  };
  const baseline = { ...node };
  const desired = { ...node, parentId: '2', title: 'New' };
  node = { ...node, title: 'Remote' };
  await assert.rejects(writeBookmark(api, { type: 'modified', baseline, desired }), /冲突/);
  node = { ...baseline, parentId: '2' };
  assert.deepEqual(await writeBookmark(api, { type: 'modified', baseline, desired }), desired);
  await writeBookmark(api, { type: 'deleted', baseline: desired });
  assert.equal(await writeBookmark(api, { type: 'deleted', baseline: desired }), null);
});
