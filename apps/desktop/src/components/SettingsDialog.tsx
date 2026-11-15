import { useState } from 'react';
import { Puzzle, Sparkles } from 'lucide-react';
import { api, messageOf, type AgentProfile, type AgentSettings, type ChromeConnection } from '../lib/api';
import { Dialog } from './Dialog';

export type SettingsPage = 'agent' | 'chrome';

export function SettingsDialog({ page, selectPage, chrome, settings, agentBusy, saved, close }: {
  page: SettingsPage;
  selectPage: (page: SettingsPage) => void;
  chrome: ChromeConnection;
  settings: AgentSettings | null;
  agentBusy: boolean;
  saved: (settings: AgentSettings) => void;
  close: () => void;
}) {
  const [draft, setDraft] = useState<AgentProfile>(settings ?? { provider: 'openai', modelId: '', baseUrl: '' });
  const [key, setKey] = useState('');
  const [clearKey, setClearKey] = useState(false);
  const [pending, setPending] = useState<'test' | 'save' | null>(null);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [copyNotice, setCopyNotice] = useState('');
  const canReuse = settings?.hasKey && draft.provider === settings.provider &&
    (draft.provider !== 'compatible' || draft.baseUrl.trim().replace(/\/+$/, '') === settings.baseUrl);

  function update(next: AgentProfile) {
    if (next.provider !== draft.provider || next.baseUrl !== draft.baseUrl) {
      setKey('');
      setClearKey(false);
    }
    setDraft(next);
    setNotice(null);
  }

  async function submit(action: 'test' | 'save') {
    if (pending) return;
    setPending(action);
    setNotice(null);
    try {
      const input = { ...draft, apiKey: key, clearKey };
      if (action === 'test') {
        await api.testAgentSettings(input);
        setNotice({ text: '连接成功，模型已通过工具调用测试。' });
      } else {
        const result = await api.saveAgentSettings(input);
        setDraft(result);
        setKey('');
        setClearKey(false);
        saved(result);
        setNotice({ text: '设置已保存。下一条 Agent 消息将开启新会话。' });
      }
    } catch (error) {
      setNotice({ text: messageOf(error), error: true });
    } finally {
      setPending(null);
    }
  }

  return (
    <Dialog title="设置" close={close} busy={pending === 'save'} wide>
      <div className="grid min-h-[370px] grid-cols-[160px_minmax(0,1fr)]">
        <nav aria-label="设置分类" className="space-y-1 border-r border-[#dadce0] bg-[#f8f9fa] p-2.5">
          {([{ id: 'agent', label: 'Agent', icon: Sparkles }, { id: 'chrome', label: 'Chrome 扩展', icon: Puzzle }] as const)
            .map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => selectPage(id)} aria-current={page === id ? 'page' : undefined}
                className={'flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-[13px] focus-visible:outline-2 focus-visible:outline-[#1a73e8] ' +
                  (page === id ? 'bg-[#e8f0fe] font-medium text-[#1967d2]' : 'hover:bg-[#f1f3f4]')}>
                <Icon size={15} /> {label}
              </button>
            ))}
        </nav>
        {page === 'agent' ? (
          <form className="space-y-3 p-4 text-[13px]" autoComplete="off" onSubmit={event => {
            event.preventDefault();
            void submit('save');
          }}>
            <h3 className="text-sm font-semibold">Agent</h3>
            <fieldset className="space-y-3" disabled={Boolean(pending)}>
              <label className="block space-y-1">
                <span>模型提供商</span>
                <select className="sb-input block w-full bg-white" value={draft.provider}
                  onChange={event => update({ provider: event.target.value as AgentProfile['provider'], modelId: '', baseUrl: '' })}>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="compatible">OpenAI 兼容接口</option>
                </select>
              </label>
              {draft.provider === 'compatible' && <label className="block space-y-1">
                <span>Base URL</span>
                <input className="sb-input block w-full" placeholder="http://localhost:11434/v1"
                  value={draft.baseUrl} onChange={event => update({ ...draft, baseUrl: event.target.value })} />
              </label>}
              <label className="block space-y-1">
                <span>模型 ID</span>
                <input className="sb-input block w-full" placeholder="填写提供商给出的模型 ID" value={draft.modelId}
                  onChange={event => update({ ...draft, modelId: event.target.value })} />
              </label>
              <div className="space-y-1">
                <label className="block space-y-1">
                  <span>API Key</span>
                  <input className="sb-input block w-full" type="password" autoComplete="new-password"
                    placeholder={clearKey ? '保存后清除' : canReuse ? '已保存，输入可替换' : '输入 API Key'}
                    value={key} onChange={event => { setKey(event.target.value); setClearKey(false); setNotice(null); }} />
                </label>
                {canReuse && <button type="button" className="text-xs text-[#1967d2] hover:underline"
                  onClick={() => { setClearKey(!clearKey); setKey(''); setNotice(null); }}>
                  {clearKey ? '撤销清除' : '清除已保存密钥'}
                </button>}
              </div>
            </fieldset>
            <p className="text-xs leading-relaxed text-[#5f6368]">使用远程模型时，请求和相关书签结果会发往所选服务。连接测试使用固定示例。</p>
            {notice && <p role={notice.error ? 'alert' : 'status'}
              className={'break-words rounded-md px-3 py-2 ' + (notice.error ? 'bg-[#fce8e6] text-[#c5221f]' : 'bg-[#e6f4ea] text-[#137333]')}>
              {notice.text}
            </p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="sb-button" disabled={Boolean(pending)} onClick={() => void submit('test')}>
                {pending === 'test' ? '测试中…' : '测试连接'}
              </button>
              <button type="submit" className="sb-button sb-primary" disabled={Boolean(pending) || agentBusy}>
                {pending === 'save' ? '保存中…' : '保存'}
              </button>
            </div>
            {agentBusy && <p className="text-right text-xs text-[#5f6368]">当前 Agent 请求完成后即可保存。</p>}
          </form>
        ) : (
          <section className="space-y-3 p-4 text-[13px]">
            <h3 className="text-sm font-semibold">Chrome 扩展</h3>
            <p role="status" className={chrome.state === 'connected' ? 'text-[#137333]' : 'text-[#5f6368]'}>
              {chrome.state === 'connected' ? '已连接到 Chrome' : chrome.error || 'Chrome 扩展未连接'}
            </p>
            {chrome.state !== 'connected' && <>
              <p>在 Chrome 的扩展管理页加载 Smart Bookmark。打开扩展弹窗并输入下方配对码。</p>
              <div className="flex items-center gap-2">
                <code className="rounded-md bg-[#f1f3f4] px-3 py-2 select-all">{chrome.code}</code>
                <button className="sb-button" disabled={!chrome.code} onClick={() => void navigator.clipboard.writeText(chrome.code)
                  .then(() => setCopyNotice('已复制')).catch(error => setCopyNotice(messageOf(error)))}>复制配对码</button>
              </div>
              {copyNotice && <p role="status">{copyNotice}</p>}
            </>}
          </section>
        )}
      </div>
    </Dialog>
  );
}
