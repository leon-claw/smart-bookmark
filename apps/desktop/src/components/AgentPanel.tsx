import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import type { Bookmark } from '../lib/types';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ids?: string[];
  changed?: number;
  error?: boolean;
  retry?: string;
}

export function AgentPanel({ messages, busy, bookmarks, close, send, select }: {
  messages: Message[];
  busy: boolean;
  bookmarks: Bookmark[];
  close: () => void;
  send: (prompt: string) => void;
  select: (id: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => bottom.current?.scrollIntoView({ block: 'nearest' }), [messages, busy]);
  const byId = new Map(bookmarks.map(bookmark => [bookmark.id, bookmark]));
  return (
    <aside aria-label="Pi Agent" className="absolute inset-y-0 right-0 z-20 flex w-[min(380px,100%)] flex-col border-l border-[#dadce0] bg-white shadow-lg">
      <header className="flex items-center gap-2 border-b border-[#dadce0] px-4 py-3 text-sm font-semibold">
        <Sparkles size={16} className="text-[#1a73e8]" /> Pi Agent
        <button className="ml-auto rounded-md p-1 hover:bg-[#f1f3f4]" aria-label="关闭 Agent" onClick={close}><X size={17} /></button>
      </header>
      <div className="chrome-scroll flex-1 space-y-3 overflow-auto p-4 text-[13px]" aria-live="polite">
        {!messages.length && <p className="text-[#5f6368]">可以请 Pi 查找、新增、修改或删除本地书签。</p>}
        {messages.map(message => <div key={message.id} className={
          'space-y-2 rounded-lg p-3 ' + (message.error ? 'bg-[#fce8e6] text-[#c5221f]' :
            message.role === 'user' ? 'ml-8 bg-[#e8f0fe]' : 'mr-4 bg-[#f1f3f4]')
        }>
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
          {!!message.changed && <p className="text-xs text-[#137333]">已更新本地书签 {message.changed} 条</p>}
          {message.ids?.map(id => byId.get(id)).filter(Boolean).map(bookmark =>
            <button className="block max-w-full truncate text-left text-[#1967d2] hover:underline" key={bookmark.id} onClick={() => select(bookmark.id)}>
              {bookmark.title || bookmark.url}
            </button>)}
          {message.retry && <button className="text-xs underline" disabled={busy} onClick={() => send(message.retry)}>重试</button>}
        </div>)}
        {busy && <p role="status" className="text-[#5f6368]">Pi 正在处理…</p>}
        <div ref={bottom} />
      </div>
      <form className="flex gap-2 border-t border-[#dadce0] p-3" onSubmit={event => {
        event.preventDefault();
        if (!draft.trim() || busy) return;
        send(draft.trim());
        setDraft('');
      }}>
        <input className="sb-input min-w-0 flex-1" aria-label="书签请求" placeholder="查找我收藏的 SQLite 文档" value={draft} onChange={event => setDraft(event.target.value)} />
        <button className="sb-button sb-primary" aria-label="发送" disabled={busy || !draft.trim()}><Send size={16} /></button>
      </form>
    </aside>
  );
}
