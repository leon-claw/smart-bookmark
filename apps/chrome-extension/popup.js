const form = document.querySelector('form');
const status = document.querySelector('#status');
const code = document.querySelector('#code');
const help = document.querySelector('#help');

async function refresh() {
  try {
    const result = await chrome.runtime.sendMessage({ action: 'status' });
    status.className = result.state;
    status.textContent = {
      connected: '已连接到桌面端',
      disconnected: '桌面端未连接',
      connecting: '正在连接…',
      error: result.error,
    }[result.state];
    form.hidden = result.state === 'connected';
    help.textContent = form.hidden ? '请在桌面端导入书签或确认写回。'
      : '启动 Smart Bookmark，在顶部打开 Chrome 连接信息，复制配对码。';
  } catch (error) {
    status.className = 'error';
    status.textContent = error.message;
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  await chrome.runtime.sendMessage({ action: 'pair', code: code.value.trim() });
  await refresh();
});
void refresh();
setInterval(refresh, 800);
