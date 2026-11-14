import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';

export class ChromeBridge {
  #socket;
  #profile;
  #error;
  #pending = new Map();
  #code = randomBytes(9).toString('base64url');

  constructor(library, port = 49321) {
    this.library = library;
    this.server = new WebSocketServer({
      host: '127.0.0.1', port, maxPayload: 32 * 1024 * 1024,
      verifyClient: ({ origin }) => /^chrome-extension:\/\/[a-p]{32}$/.test(origin),
    });
    this.ready = new Promise((resolve, reject) => {
      this.server.once('listening', () => resolve(this.server.address().port));
      this.server.once('error', error => {
        this.#error = error.code === 'EADDRINUSE' ? '本机连接端口已被占用' : error.message;
        reject(error);
      });
    });
    this.server.on('connection', (socket, request) => this.#connect(socket, request.headers.origin));
  }

  status() {
    const connected = this.#socket?.readyState === WebSocket.OPEN;
    return {
      state: this.#error ? 'error' : connected ? 'connected' : 'disconnected',
      code: this.#code,
      error: this.#error,
      profile: connected ? this.#profile : undefined,
    };
  }

  #connect(socket, origin) {
    const nonce = randomUUID();
    const deadline = setTimeout(() => socket.close(1008, 'Pairing timed out'), 5000);
    socket.on('error', () => socket.terminate());
    socket.on('close', () => {
      clearTimeout(deadline);
      if (this.#socket !== socket) return;
      this.#socket = undefined;
      this.#profile = undefined;
      for (const { socket: owner, finish } of this.#pending.values()) {
        if (owner === socket) finish(new Error('Chrome 扩展连接已断开'));
      }
    });
    socket.on('message', raw => {
      try {
        const msg = JSON.parse(raw.toString());
        if (this.#socket !== socket) {
          clearTimeout(deadline);
          this.#handshake(socket, origin, nonce, msg);
        } else if (msg.type === 'result') {
          const pending = this.#pending.get(msg.id);
          if (pending?.socket === socket) pending.finish(msg.ok ? null : new Error(String(msg.error)), msg.value);
        }
      } catch {
        socket.close(1008, 'Invalid message');
      }
    });
    socket.send(JSON.stringify({ type: 'challenge', nonce }));
  }

  #handshake(socket, origin, serverNonce, msg) {
    const send = data => socket.send(JSON.stringify({ type: 'welcome', ...data }));
    const profile = this.library.setting('chromeProfile');
    const saved = this.library.setting('pairedExtension');
    const previous = saved && JSON.parse(saved);
    const pairing = msg.pairing === true;
    const secret = pairing ? this.#code
      : previous?.profile === msg.profile && previous?.origin === origin ? previous.secret : undefined;
    const signature = side => createHmac('sha256', secret)
      .update(JSON.stringify([side, serverNonce, msg.nonce, msg.profile])).digest();
    const proof = typeof msg.proof === 'string' && /^[a-f0-9]{64}$/.test(msg.proof)
      ? Buffer.from(msg.proof, 'hex') : undefined;

    if (msg.type !== 'hello' || typeof msg.profile !== 'string' || !msg.profile || msg.profile.length > 100 ||
        typeof msg.nonce !== 'string' || !/^[a-f0-9-]{36}$/.test(msg.nonce) ||
        (profile && profile !== msg.profile) || !secret || !proof || !timingSafeEqual(proof, signature('extension'))) {
      send({ ok: false, error: profile && profile !== msg.profile
        ? '请使用首次导入时的 Chrome 配置' : '请在桌面端查看配对码后重新连接' });
      socket.close(1008, 'Pairing required');
      return;
    }

    if (pairing) {
      this.library.setSetting('pairedExtension', JSON.stringify({ secret, origin, profile: msg.profile }));
      this.#code = randomBytes(9).toString('base64url');
    }
    if (this.#socket && this.#socket !== socket) {
      this.#socket.terminate();
      for (const { finish } of this.#pending.values()) finish(new Error('Chrome 扩展已重新连接'));
    }
    this.#socket = socket;
    this.#profile = msg.profile;
    send({ ok: true, proof: signature('desktop').toString('hex') });
  }

  request(action, payload) {
    const socket = this.#socket;
    if (socket?.readyState !== WebSocket.OPEN) return Promise.reject(new Error('Chrome 扩展未连接'));
    return new Promise((resolve, reject) => {
      const id = randomUUID();
      const finish = (error, value) => {
        clearTimeout(timer);
        this.#pending.delete(id);
        if (error) reject(error);
        else resolve(value);
      };
      const timer = setTimeout(() => finish(new Error('Chrome 扩展响应超时')), 15000);
      this.#pending.set(id, { socket, finish });
      socket.send(JSON.stringify({ type: 'request', id, action, payload }), error => {
        if (error) finish(error);
      });
    });
  }

  close() {
    for (const socket of this.server.clients) socket.terminate();
    this.server.close();
  }
}
