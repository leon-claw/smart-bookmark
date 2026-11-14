import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { test } from 'node:test';
import WebSocket from 'ws';
import { ChromeBridge } from '../main/bridge.mjs';

test('pairs one Chrome profile and routes a bookmark request', async () => {
  const settings = new Map();
  const library = { setting: key => settings.get(key), setSetting: (key, value) => settings.set(key, value) };
  const bridge = new ChromeBridge(library, 0);
  const port = await bridge.ready;
  const socket = new WebSocket('ws://127.0.0.1:' + port, {
    origin: 'chrome-extension://' + 'a'.repeat(32),
  });
  try {
    const [challengeMessage] = await once(socket, 'message');
    const { nonce: serverNonce } = JSON.parse(challengeMessage);
    const nonce = randomUUID();
    const code = bridge.status().code;
    const signature = side => createHmac('sha256', code)
      .update(JSON.stringify([side, serverNonce, nonce, 'profile'])).digest('hex');
    socket.send(JSON.stringify({ type: 'hello', profile: 'profile', nonce, pairing: true, proof: signature('extension') }));
    const [welcome] = await once(socket, 'message');
    assert.deepEqual(JSON.parse(welcome), { type: 'welcome', ok: true, proof: signature('desktop') });
    assert.equal(bridge.status().state, 'connected');
    const response = bridge.request('tree');
    const [request] = await once(socket, 'message');
    const { id, action } = JSON.parse(request);
    assert.equal(action, 'tree');
    socket.send(JSON.stringify({ type: 'result', id, ok: true, value: ['tree'] }));
    assert.deepEqual(await response, ['tree']);
  } finally {
    socket.terminate();
    bridge.close();
  }
});
