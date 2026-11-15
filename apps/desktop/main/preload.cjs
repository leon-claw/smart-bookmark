const { contextBridge, ipcRenderer } = require('electron');

const names = [
  'snapshot', 'chromeStatus', 'create', 'save', 'remove', 'restore', 'revert',
  'import', 'writeback', 'agent',
  'agentSettings', 'saveAgentSettings', 'testAgentSettings',
];
contextBridge.exposeInMainWorld('bookmarkApp', Object.fromEntries(
  names.map(name => [name, (...args) => ipcRenderer.invoke('bookmarks:' + name, ...args)]),
));
