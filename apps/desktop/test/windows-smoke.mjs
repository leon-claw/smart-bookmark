import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const desktop = join(root, 'apps', 'desktop');
const extension = join(root, 'apps', 'chrome-extension');
const browserPath = process.env.SMART_BOOKMARK_TEST_CHROME;
const packaged = process.env.SMART_BOOKMARK_TEST_APP;
if (!browserPath) throw new Error('Set SMART_BOOKMARK_TEST_CHROME to Chrome for Testing or Chromium');
const temp = await mkdtemp(join(tmpdir(), 'smart-bookmark-e2e-'));
const profile = join(temp, 'desktop');
const browserProfile = join(temp, 'chrome');
const pi = join(temp, 'pi');
const children = [];
const sockets = [];
const browsers = [];
let requests = 0;

const model = createServer(async (req, res) => {
  let data = '';
  for await (const chunk of req) data += chunk;
  const body = JSON.parse(data);
  if (body.tools?.map(tool => tool.function.name).join() !== 'bash') {
    return res.writeHead(400).end('Expected only bash');
  }
  requests++;
  const done = body.messages.some(message => message.role === 'tool');
  const answer = done ? { content: '已添加书签' } : {
    tool_calls: [{ index: 0, id: 'call_add', type: 'function', function: {
      name: 'bash', arguments: JSON.stringify({ command: 'bookmark add {"title":"Pi SQLite","url":"https://sqlite.org/"}' }),
    } }],
  };
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  for (const choice of [{ delta: { role: 'assistant' } }, { delta: answer }, { delta: {}, finish_reason: done ? 'stop' : 'tool_calls' }]) {
    res.write('data: ' + JSON.stringify({
      id: 'test', object: 'chat.completion.chunk', created: 1, model: 'test-bookmarks', choices: [{ index: 0, ...choice }],
    }) + '\n\n');
  }
  res.end('data: [DONE]\n\n');
});

async function until(read, label) {
  let error;
  for (let i = 0; i < 100; i++) {
    try {
      const result = await read();
      if (result) return result;
    } catch (failure) { error = failure; }
    await delay(200);
  }
  throw new Error(label + ': ' + (error?.message ?? 'timed out'));
}

async function launch(path, args, dir, env = process.env) {
  const port = await new Promise(resolve => {
    const probe = createServer().listen(0, '127.0.0.1', () => {
      const port = probe.address().port;
      probe.close(() => resolve(port));
    });
  });
  const child = spawn(path, [...args, '--remote-debugging-port=' + port, '--user-data-dir=' + dir], {
    env, stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true,
  });
  children.push(child);
  let log = '';
  child.stderr.on('data', buffer => { log = (log + buffer).slice(-2000); });
  const url = await until(async () => {
    try {
      const response = await fetch('http://127.0.0.1:' + port + '/json/version');
      return (await response.json()).webSocketDebuggerUrl;
    } catch (error) {
      throw new Error(error.message + ' (exit ' + child.exitCode + ') ' + log);
    }
  }, path);
  const socket = new WebSocket(url);
  sockets.push(socket);
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
  let id = 0;
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const key = ++id;
    const timeout = setTimeout(() => { socket.off('message', receive); reject(new Error(method + ' timed out')); }, 30000);
    function receive(raw) {
      const msg = JSON.parse(raw.toString());
      if (msg.id !== key) return;
      clearTimeout(timeout);
      socket.off('message', receive);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
    socket.on('message', receive);
    socket.send(JSON.stringify({ id: key, method, params, sessionId }));
  });
  browsers.push(send);
  return send;
}

async function attach(send, id) {
  const { sessionId } = await send('Target.attachToTarget', { targetId: id, flatten: true });
  return async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
}

try {
  await mkdir(pi);
  await new Promise(resolve => model.listen(0, '127.0.0.1', resolve));
  await writeFile(join(pi, 'settings.json'), JSON.stringify({ defaultProvider: 'smoke', defaultModel: 'test-bookmarks' }));
  await writeFile(join(pi, 'models.json'), JSON.stringify({ providers: { smoke: {
    baseUrl: 'http://127.0.0.1:' + model.address().port + '/v1', api: 'openai-completions',
    apiKey: 'test-only', models: [{ id: 'test-bookmarks' }],
  } } }));
  const [app, chrome] = await Promise.all([
    launch(packaged || join(desktop, 'node_modules', 'electron', 'dist', 'electron.exe'),
      packaged ? [] : [desktop], profile, { ...process.env, PI_CODING_AGENT_DIR: pi }),
    launch(browserPath, ['--headless=new', '--no-first-run', '--no-default-browser-check',
      '--load-extension=' + extension, '--disable-extensions-except=' + extension], browserProfile),
  ]);
  async function target(send, predicate, label) {
    return until(async () => (await send('Target.getTargets')).targetInfos.find(predicate), label);
  }
  const desktopPage = await target(app, info => info.type === 'page' && info.url.includes('/dist/index.html'), 'desktop window');
  const worker = await target(chrome, info => info.type === 'service_worker' && info.url.endsWith('/background.js'), 'extension worker');
  const render = await attach(app, desktopPage.targetId);
  const browser = await attach(chrome, worker.targetId);
  const call = (name, ...args) => render('window.bookmarkApp.' + name + '(...' + JSON.stringify(args) + ')');
  await until(() => render('document.body.innerText.includes("欢迎使用 Smart Bookmark")'), 'desktop empty state');
  assert.equal((await call('snapshot')).bookmarks.length, 0);
  const { code } = await call('chromeStatus');
  const { targetId } = await chrome('Target.createTarget', { url: worker.url.replace('background.js', 'popup.html') });
  const popup = await attach(chrome, targetId);
  await until(() => popup('Boolean(document.querySelector("#code"))'), 'extension popup');
  await until(() => popup('document.querySelector("#status").textContent !== "正在检查桌面连接…"'), 'extension popup ready');
  await popup('document.querySelector("#code").value = ' + JSON.stringify(code) + '; document.querySelector("form").requestSubmit(); true');
  await until(async () => {
    const status = await call('chromeStatus');
    if (status.error) throw new Error(status.error);
    if (status.state === 'connected') return true;
    throw new Error(await popup('document.querySelector("#status").textContent'));
  }, 'Chrome connection');
  const seed = await browser('chrome.bookmarks.create({parentId:"1",title:"Chrome seed",url:"https://example.org/seed"})');
  await until(() => render('document.querySelector("header [aria-label=\\"Chrome 扩展连接\\"]")?.innerText.includes("已连接")'), 'connection indicator');
  await render('[...document.querySelectorAll("header button")].find(b => b.innerText.includes("从 Chrome 导入")).click(); true');
  const [bookmark] = await until(async () => {
    const { bookmarks } = await call('snapshot');
    return bookmarks.length && bookmarks;
  }, 'import from Chromium');
  assert.equal(bookmark.chromeId, seed.id);
  await until(() => render('document.body.innerText.includes("Chrome seed")'), 'imported title');
  await render('[...document.querySelectorAll("[role=option]")].find(b => b.innerText.includes("Chrome seed")).click(); true');
  await until(() => render('Boolean(document.querySelector("#detail-title"))'), 'detail form');
  await render('var input = document.querySelector("#detail-title"); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,"Updated locally"); input.dispatchEvent(new Event("input",{bubbles:true})); true');
  await render('input.form.requestSubmit(); true');
  await until(async () => (await call('snapshot')).bookmarks[0].title === 'Updated locally', 'local save');
  const getSeed = async () => (await browser('chrome.bookmarks.get(' + JSON.stringify(seed.id) + ')'))[0];
  assert.equal((await getSeed()).title, 'Chrome seed');
  await render('[...document.querySelectorAll("header button")].find(b => b.innerText.includes("写回 Chrome")).click(); true');
  await until(() => render('Boolean(document.querySelector("dialog[open]"))'), 'writeback preview');
  await render('[...document.querySelectorAll("dialog button")].find(b => b.innerText === "写回 1 条").click(); true');
  await until(async () => (await call('snapshot')).pending.length === 0, 'writeback result');
  assert.equal((await getSeed()).title, 'Updated locally');

  const local = await call('create', {
    title: 'Desktop seed', url: 'https://example.org/local', folderId: 'local', notes: 'private note', tags: ['local tag'],
  });
  const additions = (await call('snapshot')).pending;
  assert.deepEqual(await call('writeback', additions), { written: 1, errors: [] });
  const saved = (await call('snapshot')).bookmarks.find(bookmark => bookmark.id === local.id);
  assert.equal(saved.notes, 'private note');
  assert.deepEqual(saved.tags, ['local tag']);
  const chromeId = JSON.stringify(saved.chromeId);
  assert.equal((await browser('chrome.bookmarks.get(' + chromeId + ')'))[0].title, 'Desktop seed');
  await call('remove', local.id);
  assert.equal((await browser('chrome.bookmarks.get(' + chromeId + ')')).length, 1);
  assert.deepEqual(await call('writeback', (await call('snapshot')).pending), { written: 1, errors: [] });
  assert.equal((await browser('chrome.bookmarks.search({title:"Desktop seed"})')).length, 0);

  const agent = await call('agent', '请新增 SQLite 书签');
  assert.equal(agent.changed.length, 1);
  assert.equal((await call('snapshot')).bookmarks.some(bookmark => bookmark.title === 'Pi SQLite'), true);
  assert.equal(requests, 2);
  console.log('Passed: Electron window, Chromium extension pairing, import, local UI save, explicit writeback, and Pi SDK against a local test model.');
} finally {
  await Promise.allSettled(browsers.map(send => Promise.race([send('Browser.close'), delay(1200)])));
  await delay(500);
  for (const socket of sockets) socket.terminate();
  for (const child of children) {
    if (child.exitCode === null && child.pid) {
      await new Promise(resolve => {
        const cleanup = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
        cleanup.once('exit', resolve);
        cleanup.once('error', resolve);
      });
    }
  }
  model.closeAllConnections();
  await new Promise(resolve => model.close(resolve));
  await delay(800);
  await rm(temp, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
}
