import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Library } from '../main/library.mjs';
import { runBookmarkCommand } from '../main/agent-command.mjs';

test('agent command supports local CRUD without invoking arbitrary commands', () => {
  const library = new Library(':memory:');
  const command = (verb, args) => runBookmarkCommand(library, 'bookmark ' + verb + ' ' + JSON.stringify(args));
  try {
    const { id } = command('add', { title: 'SQLite', url: 'https://sqlite.org/' });
    assert.equal(command('find', { query: 'sqlite' }).items[0].id, id);
    assert.equal(command('update', { id, addTags: ['待读'] }).tags[0], '待读');
    assert.throws(() => runBookmarkCommand(library, 'bookmark find {}; whoami'), /JSON|命令/);
    assert.throws(() => runBookmarkCommand(library, 'powershell Get-ChildItem'), /bookmark/);
    command('delete', { id });
    assert.equal(command('find', { query: 'sqlite' }).items.length, 0);
  } finally {
    library.close();
  }
});
