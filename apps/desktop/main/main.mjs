import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Library } from './library.mjs';
import { ChromeBridge } from './bridge.mjs';

const index = fileURLToPath(new URL('../dist/index.html', import.meta.url));
let window;
let library;
let chrome;
let agent;
let writebackInProgress = false;
let importInProgress = false;

function openWindow() {
  window = new BrowserWindow({
    width: 1420, height: 900, minWidth: 690, minHeight: 550,
    autoHideMenuBar: true,
    webPreferences: {
      preload: fileURLToPath(new URL('./preload.cjs', import.meta.url)),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:$/.test(URL.parse(url)?.protocol ?? '')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  void window.loadFile(index);
}

function handle(name, callback) {
  ipcMain.handle('bookmarks:' + name, (event, ...args) => {
    if (event.sender !== window?.webContents || event.senderFrame?.url !== pathToFileURL(index).href) {
      throw new Error('请求来源无效');
    }
    return callback(...args);
  });
}

function start() {
  const dataDir = app.getPath('userData');
  mkdirSync(dataDir, { recursive: true });
  library = new Library(join(dataDir, 'bookmarks.sqlite'));
  chrome = new ChromeBridge(library);
  void chrome.ready.catch(() => {});
  handle('snapshot', () => library.snapshot());
  handle('chromeStatus', () => chrome.status());
  handle('create', data => library.create(data));
  handle('save', data => library.save(data));
  handle('remove', id => library.remove(id));
  handle('restore', id => library.restore(id));
  handle('revert', id => library.revert(id));

  handle('import', async () => {
    if (importInProgress || writebackInProgress) throw new Error('请等待当前 Chrome 操作完成');
    importInProgress = true;
    try {
      const profile = chrome.status().profile;
      if (!profile) throw new Error('Chrome 扩展未连接');
      return library.importTree(profile, await chrome.request('tree'));
    } finally {
      importInProgress = false;
    }
  });

  handle('writeback', async (items) => {
    if (writebackInProgress || importInProgress) throw new Error('请等待当前 Chrome 操作完成');
    if (!Array.isArray(items) || !items.length) throw new Error('请先选择要写回的书签');
    const profile = chrome.status().profile;
    if (!profile || profile !== library.setting('chromeProfile')) throw new Error('请先连接 Chrome 并导入书签');
    const pending = new Map(library.snapshot().pending.map(change => [change.bookmarkId, change]));
    writebackInProgress = true;
    try {
      const errors = [];
      let written = 0;
      for (const item of items) {
        const change = pending.get(item.bookmarkId);
        if (!change || JSON.stringify(change) !== JSON.stringify(item)) {
          errors.push(item.bookmark.title + '：本地数据已改变，请刷新后重新选择');
          continue;
        }
        try {
          const node = await chrome.request('write', library.request(change));
          library.acknowledge(change, node);
          if (change.type === 'added') void chrome.request('forget', change.bookmarkId).catch(() => {});
          written++;
        } catch (error) {
          errors.push(change.bookmark.title + '：' + error.message);
        }
      }
      return { written, errors };
    } finally {
      writebackInProgress = false;
    }
  });

  handle('agent', async text => {
    if (!agent) {
      const { BookmarkAgent } = await import('./agent.mjs');
      agent ??= new BookmarkAgent(library, dataDir);
    }
    return agent.prompt(text);
  });
  openWindow();
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', () => {
    agent?.close();
    chrome.close();
    library.close();
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (window?.isMinimized()) window.restore();
    window?.focus();
  });
  void app.whenReady().then(start).catch(error => {
    console.error(error);
    dialog.showErrorBox('Smart Bookmark 无法启动', error.message);
    app.quit();
  });
}
