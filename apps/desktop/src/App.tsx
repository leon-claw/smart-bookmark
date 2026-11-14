import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark as BookmarkIcon, Download, Menu, Plus, Puzzle, Search, Sparkles, Upload, X } from 'lucide-react';
import { BookmarkDetailPanel } from './components/BookmarkDetailPanel';
import { BookmarkList } from './components/BookmarkList';
import { NewBookmarkModal } from './components/NewBookmarkModal';
import { SidebarTree } from './components/SidebarTree';
import { AgentPanel, type Message } from './components/AgentPanel';
import { Dialog } from './components/Dialog';
import { WritebackDialog } from './components/WritebackDialog';
import { api, type BookmarkInput, type ChromeConnection, type Snapshot } from './lib/api';
import { collectAllTags, filterBookmarks } from './lib/bookmarkStore';
import type { ImportStatus, PendingChange, SidebarScope } from './lib/types';

const empty: Snapshot = { folders: [], bookmarks: [], pending: [] };
const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error))
  .replace(/^Error invoking remote method '[^']+': Error: /, '');

export default function App() {
  const [data, setData] = useState(empty);
  const [loaded, setLoaded] = useState(false);
  const [chrome, setChrome] = useState<ChromeConnection>({ state: 'disconnected', code: '' });
  const [scope, setScope] = useState<SidebarScope>({ kind: 'all' });
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [sidebar, setSidebar] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [modal, setModal] = useState<'new' | 'connection' | 'writeback' | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [importedCount, setImportedCount] = useState(0);
  const [writing, setWriting] = useState(false);
  const [result, setResult] = useState<{ written: number; errors: string[] } | null>(null);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentBusy, setAgentBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [copied, setCopied] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const refreshSequence = useRef(0);

  const refresh = useCallback(async () => {
    const sequence = ++refreshSequence.current;
    const next = await api.snapshot();
    if (sequence === refreshSequence.current) {
      setData(next);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh().catch(error => setError(messageOf(error)));
    const status = () => void api.chromeStatus().then(setChrome).catch(error => setError(messageOf(error)));
    status();
    const timer = window.setInterval(status, 1200);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        search.current?.focus();
      }
      if (event.key === 'Escape' && modal === 'new') setModal(null);
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [modal]);

  const pendingMap = useMemo(() => new Map(data.pending.map(change => [change.bookmarkId, change])), [data.pending]);
  const filtered = useMemo(() => filterBookmarks(data.bookmarks, data.folders, scope, query, new Set(pendingMap.keys())),
    [data, scope, query, pendingMap]);
  const tags = useMemo(() => collectAllTags(data.bookmarks), [data.bookmarks]);
  const selected = data.bookmarks.find(bookmark => bookmark.id === selectedId) ?? null;
  const deleted = data.pending.filter(change => change.type === 'deleted');
  const openConnection = () => { setCopied(false); setModal('connection'); };
  const openWriteback = () => { setResult(null); setModal('writeback'); };
  const clearFilters = () => { setScope({ kind: 'all' }); setQuery(''); };
  const select = (id: string) => { setSelectedId(id); setMobileDetail(true); };

  async function apply(action: () => Promise<unknown>, done?: () => void) {
    setError('');
    try {
      await action();
      await refresh();
      done?.();
    } catch (failure) {
      setError(messageOf(failure));
    }
  }

  async function startImport() {
    if (chrome.state !== 'connected') return openConnection();
    if (importStatus === 'importing') return;
    setImportStatus('importing');
    await apply(async () => {
      try {
        setImportedCount(await api.import());
        setImportStatus('success');
      } catch (error) {
        setImportStatus('idle');
        throw error;
      }
    });
  }

  async function writeback(changes: PendingChange[]) {
    setWriting(true);
    try {
      setResult(await api.writeback(changes));
      await refresh();
    } catch (error) {
      setResult({ written: 0, errors: [messageOf(error)] });
    } finally {
      setWriting(false);
    }
  }

  async function send(prompt: string) {
    if (agentBusy) return;
    setAgentBusy(true);
    setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'user', text: prompt }]);
    try {
      const response = await api.agent(prompt);
      setMessages(previous => [...previous, {
        id: crypto.randomUUID(), role: 'assistant', text: response.text,
        ids: [...new Set([...response.matched, ...response.changed])], changed: response.changed.length,
      }]);
    } catch (error) {
      setMessages(previous => [...previous, {
        id: crypto.randomUUID(), role: 'assistant', text: messageOf(error), error: true, retry: prompt,
      }]);
    } finally {
      await refresh().catch(error => setError(messageOf(error)));
      setAgentBusy(false);
    }
  }

  const detailProps = {
    bookmark: selected, folders: data.folders, pendingChange: pendingMap.get(selectedId ?? ''), justSavedId: savedId,
    onSaveBookmark: (input: BookmarkInput & { id: string }) => void apply(() => api.save(input), () => setSavedId(input.id)),
    onRevertBookmark: (id: string) => void apply(() => api.revert(id)),
    onDeleteBookmark: (id: string) => void apply(() => api.remove(id), () => { setSelectedId(null); setMobileDetail(false); }),
  };
  const treeProps = {
    folders: data.folders, bookmarks: data.bookmarks, allTags: tags, scope,
    onSelectScope: (next: SidebarScope) => { setScope(next); setSidebar(false); },
    pendingCount: data.pending.length, onOpenExtensionPreview: openConnection,
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden text-[#202124]">
      <header className="flex h-[54px] shrink-0 items-center gap-2 border-b border-[#dadce0] bg-white px-3">
        <button className="sb-button md:hidden" aria-label="文件夹与标签" onClick={() => setSidebar(!sidebar)}><Menu size={16} /></button>
        <div className="mr-2 hidden shrink-0 items-center gap-2 text-sm font-semibold lg:flex">
          <BookmarkIcon size={18} className="text-[#1a73e8]" /> Smart Bookmark
        </div>
        <div className="relative mr-auto w-full min-w-[125px] max-w-[440px]">
          <Search size={16} className="pointer-events-none absolute top-2.5 left-3 text-[#5f6368]" />
          <input className="sb-input w-full rounded-full bg-[#f1f3f4] pr-8 pl-9" ref={search} aria-label="搜索书签"
            placeholder="搜索标题、网址、标签和备注" value={query} onChange={event => setQuery(event.target.value)} />
          {query && <button className="absolute top-2 right-2 p-0.5" aria-label="清除搜索" onClick={() => setQuery('')}><X size={15} /></button>}
        </div>
        <button className="sb-button" disabled={!loaded} onClick={() => setModal('new')}><Plus size={15} />新建书签</button>
        <button className="sb-button" disabled={!loaded || writing || importStatus === 'importing'} onClick={startImport}>
          <Download size={15} /><span>{importStatus === 'importing' ? '导入中…' : '从 Chrome 导入'}</span>
        </button>
        <button className="sb-button" disabled={!data.pending.length} onClick={openWriteback}><Upload size={15} />写回 Chrome{data.pending.length ? ' (' + data.pending.length + ')' : ''}</button>
        <button aria-label="Chrome 扩展连接" className={'sb-button ' + (chrome.state === 'connected' ? 'bg-[#e6f4ea] text-[#137333]' : '')} onClick={openConnection}>
          <Puzzle size={15} /><span className="hidden xl:inline">{chrome.state === 'connected' ? '已连接' : '连接 Chrome'}</span>
        </button>
        <button className="sb-button" aria-pressed={agentOpen} onClick={() => setAgentOpen(!agentOpen)}><Sparkles size={15} />Pi Agent</button>
      </header>
      {error && <div role="alert" className="flex items-center justify-between gap-4 bg-[#fce8e6] px-4 py-2 text-[13px] text-[#c5221f]">
        <span>{error}</span><button aria-label="关闭错误提示" onClick={() => setError('')}><X size={16} /></button>
      </div>}
      <main className="relative flex min-h-0 flex-1">
        <div className="hidden md:block"><SidebarTree {...treeProps} /></div>
        {sidebar && <div className="absolute inset-y-0 left-0 z-10 shadow-lg md:hidden"><SidebarTree {...treeProps} /></div>}
        {loaded ? <BookmarkList totalBookmarkCount={data.bookmarks.length} bookmarks={filtered} folders={data.folders}
          scope={scope} searchQuery={query} selectedId={selectedId} onSelectBookmark={select} pendingChangesMap={pendingMap}
          deletedPendingList={deleted} onRestoreDeleted={id => void apply(() => api.restore(id))}
          onClearFilters={clearFilters} onOpenNewBookmark={() => setModal('new')} onStartImport={startImport}
          onOpenAgent={() => setAgentOpen(true)} importStatus={importStatus} importedCount={importedCount}
          onDismissImportNotice={() => setImportStatus('idle')} chromeStatus={chrome.state}
          onOpenExtensionPreview={openConnection} onOpenWriteback={openWriteback} />
          : <p role="status" className="flex-1 p-5 text-sm text-[#5f6368]">正在读取本地书签…</p>}
        {selected && <div className="hidden md:flex"><BookmarkDetailPanel {...detailProps} /></div>}
        {mobileDetail && selected && <div className="absolute inset-y-0 right-0 z-10 flex shadow-lg md:hidden">
          <BookmarkDetailPanel {...detailProps} onCloseMobile={() => setMobileDetail(false)} />
        </div>}
        {agentOpen && <AgentPanel messages={messages} busy={agentBusy} bookmarks={data.bookmarks} close={() => setAgentOpen(false)}
          send={send} select={id => { clearFilters(); select(id); setAgentOpen(false); }} />}
      </main>
      {modal === 'new' && <NewBookmarkModal folders={data.folders} defaultFolderId={scope.kind === 'folder' ? scope.folderId : 'local'}
        onClose={() => setModal(null)} onCreate={input => void apply(async () => {
          const bookmark = await api.create(input);
          clearFilters();
          select(bookmark.id);
          setModal(null);
        })} />}
      {modal === 'connection' && <Dialog title="Chrome 扩展连接" close={() => setModal(null)}>
        <div className="space-y-3 text-[13px]">
          <p role="status" className={chrome.state === 'connected' ? 'text-[#137333]' : 'text-[#5f6368]'}>
            {chrome.state === 'connected' ? '已连接到 Chrome' : chrome.error || 'Chrome 扩展未连接'}
          </p>
          {chrome.state !== 'connected' && <>
            <p>在 Chrome 的扩展管理页加载 Smart Bookmark。打开扩展弹窗并输入下方配对码。</p>
            <div className="flex items-center gap-2">
              <code className="rounded-md bg-[#f1f3f4] px-3 py-2 select-all">{chrome.code}</code>
              <button className="sb-button" onClick={() => void navigator.clipboard.writeText(chrome.code)
                .then(() => setCopied(true)).catch(error => setError(messageOf(error)))}>{copied ? '已复制' : '复制配对码'}</button>
            </div>
          </>}
        </div>
      </Dialog>}
      {modal === 'writeback' && <WritebackDialog changes={data.pending} folders={data.folders}
        connected={chrome.state === 'connected' && Boolean(data.chromeProfile)} busy={writing} result={result}
        confirm={writeback} close={() => setModal(null)} />}
    </div>
  );
}
