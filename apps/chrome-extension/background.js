import { writeBookmark } from './bookmarks.js';

const address = 'ws://127.0.0.1:49321';
let socket;
let keepalive;
let state = { state: 'disconnected' };

async function identity() {
  const { profile, secret } = await chrome.storage.local.get(['profile', 'secret']);
  if (profile) return { profile, secret };
  const created = crypto.randomUUID();
  await chrome.storage.local.set({ profile: created });
  return { profile: created, secret };
}

async function signatures(secret, serverNonce, nonce, profile) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return async side => {
    const data = encoder.encode(JSON.stringify([side, serverNonce, nonce, profile]));
    const proof = await crypto.subtle.sign('HMAC', key, data);
    return Array.from(new Uint8Array(proof), byte => byte.toString(16).padStart(2, '0')).join('');
  };
}

const journal = {
  async get(id) { return (await chrome.storage.local.get('write:' + id))['write:' + id]; },
  async set(id, data) { await chrome.storage.local.set({ ['write:' + id]: data }); },
  async remove(id) { await chrome.storage.local.remove('write:' + id); },
};

async function connect(code) {
  if (!code && (state.state === 'error' || (socket && socket.readyState < WebSocket.CLOSING))) return;
  const previous = socket;
  const current = new WebSocket(address);
  socket = current;
  previous?.close();
  clearInterval(keepalive);
  state = { state: 'connecting' };
  let verify;
  let secret;
  current.addEventListener('message', async ({ data }) => {
    const msg = JSON.parse(data);
    if (socket !== current) return;
    if (msg.type === 'challenge' && !verify && typeof msg.nonce === 'string') {
      const identityData = await identity();
      secret = code || identityData.secret;
      if (!secret) {
        state = { state: 'error', error: '请输入桌面端配对码' };
        current.close();
        return;
      }
      const nonce = crypto.randomUUID();
      verify = await signatures(secret, msg.nonce, nonce, identityData.profile);
      const proof = await verify('extension');
      if (current.readyState === WebSocket.OPEN) {
        current.send(JSON.stringify({ type: 'hello', profile: identityData.profile, nonce, pairing: Boolean(code), proof }));
      }
    } else if (msg.type === 'welcome') {
      if (msg.ok && verify && msg.proof === await verify('desktop')) {
        if (code) await chrome.storage.local.set({ secret });
        state = { state: 'connected' };
        keepalive = setInterval(() => {
          if (current.readyState === WebSocket.OPEN) current.send(JSON.stringify({ type: 'ping' }));
        }, 20000);
      } else {
        state = { state: 'error', error: msg.error || '无法验证桌面客户端身份' };
        current.close();
      }
    } else if (msg.type === 'request' && state.state === 'connected') {
      try {
        let value;
        if (msg.action === 'tree') value = await chrome.bookmarks.getTree();
        else if (msg.action === 'write') value = await writeBookmark(chrome.bookmarks, msg.payload, journal);
        else if (msg.action === 'forget') await journal.remove(msg.payload);
        else throw new Error('未知书签请求');
        if (current.readyState === WebSocket.OPEN) {
          current.send(JSON.stringify({ type: 'result', id: msg.id, ok: true, value }));
        }
      } catch (error) {
        if (current.readyState === WebSocket.OPEN) {
          current.send(JSON.stringify({ type: 'result', id: msg.id, ok: false, error: error.message }));
        }
      }
    }
  });
  current.addEventListener('close', () => {
    if (socket !== current) return;
    clearInterval(keepalive);
    if (state.state !== 'error') state = { state: 'disconnected' };
  });
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || sender.url !== chrome.runtime.getURL('popup.html')) return;
  if (message.action === 'pair') void connect(message.code);
  if (message.action === 'status') void connect();
  respond(state);
});
chrome.runtime.onStartup.addListener(() => void connect());
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('reconnect', { periodInMinutes: 1 });
  void connect();
});
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'reconnect') void connect();
});
