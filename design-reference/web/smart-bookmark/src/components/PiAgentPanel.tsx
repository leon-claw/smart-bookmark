import { useState, useRef, useEffect } from 'react';
import {
  AlertCircle,
  Check,
  RefreshCw,
  Send,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import type { AgentMessage, Bookmark, FolderNode } from '../lib/types';
import { formatDisplayUrl, getFolderName } from '../lib/bookmarkStore';

interface PiAgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: AgentMessage[];
  bookmarks: Bookmark[];
  folders: FolderNode[];
  onSendPrompt: (prompt: string, simulateFailure?: boolean) => void;
  onSelectBookmark: (id: string) => void;
  pendingCount: number;
  onOpenWriteback: () => void;
}

const DEMO_PROMPTS = [
  '查找我收藏的 SQLite 文档',
  '给这两条书签加上『待读』标签',
];

export function PiAgentPanel({
  isOpen,
  onClose,
  messages,
  bookmarks,
  folders,
  onSendPrompt,
  onSelectBookmark,
  pendingCount,
  onOpenWriteback,
}: PiAgentPanelProps) {
  const [input, setInput] = useState('');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isOpen, messages.length]);

  if (!isOpen) return null;

  const bookmarksById = new Map(bookmarks.map((b) => [b.id, b]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendPrompt(input.trim(), simulateFailure);
    setInput('');
  };

  return (
    <aside
      aria-label="Pi Agent 自然语言助手面板"
      className="fixed top-[54px] bottom-0 right-0 z-30 w-full md:w-[340px] xl:w-[360px] bg-white border-l border-[#DADCE0] shadow-lg flex flex-col"
    >
      {/* Header */}
      <div className="h-11 px-4 border-b border-[#DADCE0] flex items-center justify-between shrink-0 bg-[#F8F9FA]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#E8F0FE] text-[#1967D2] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-[#202124] leading-tight">Pi Agent</h2>
            <p className="text-[11px] text-[#5F6368]">自然语言检索与本地整理</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="关闭 Pi Agent 面板"
          className="w-7 h-7 inline-flex items-center justify-center rounded-full text-[#5F6368] hover:bg-[#E8EAED]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Pending Chrome Writeback Notice */}
      {pendingCount > 0 && (
        <div className="px-4 py-2 bg-[#FEF7E0] border-b border-[#FEEFC3] flex items-center justify-between gap-2 text-[12px] text-[#B06000]">
          <span>本地已有 {pendingCount} 项待写回修改（需手动写回 Chrome）</span>
          <button
            type="button"
            onClick={onOpenWriteback}
            className="inline-flex items-center gap-1 font-medium underline whitespace-nowrap shrink-0"
          >
            <UploadCloud className="w-3.5 h-3.5" aria-hidden="true" />
            <span>写回</span>
          </button>
        </div>
      )}

      {/* Message History */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto chrome-scroll p-4 space-y-3.5">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isError = msg.status === 'error';
          const matchedItems = (msg.action?.matchedBookmarkIds ?? [])
            .map((id) => bookmarksById.get(id))
            .filter((b): b is Bookmark => Boolean(b));

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[92%] rounded-lg px-3 py-2.5 text-[13px] leading-relaxed ${
                  isUser
                    ? 'bg-[#1A73E8] text-white'
                    : isError
                      ? 'bg-[#FCE8E6] border border-[#FAD2CF] text-[#C5221F]'
                      : 'bg-[#F8F9FA] border border-[#E8EAED] text-[#202124]'
                }`}
              >
                <div className="flex items-start gap-2">
                  {isError && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />}
                  <p>{msg.content}</p>
                </div>

                {isError && msg.errorDetail && (
                  <p className="mt-1.5 text-[11.5px] font-mono text-[#5F6368] break-all">
                    {msg.errorDetail}
                  </p>
                )}

                {isError && msg.retryPrompt && (
                  <button
                    type="button"
                    onClick={() => onSendPrompt(msg.retryPrompt!, false)}
                    className="mt-2 h-7 px-2.5 inline-flex items-center gap-1 text-[12px] font-medium text-white bg-[#D93025] rounded hover:bg-[#B31412]"
                  >
                    <RefreshCw className="w-3 h-3" aria-hidden="true" />
                    <span>重试本次请求</span>
                  </button>
                )}

                {/* Matched / Affected Bookmarks */}
                {matchedItems.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    {matchedItems.map((bm) => {
                      const wasTagged =
                        msg.action?.type === 'tag_update' &&
                        msg.action.updatedBookmarkIds?.includes(bm.id);

                      return (
                        <button
                          key={bm.id}
                          type="button"
                          onClick={() => onSelectBookmark(bm.id)}
                          className="w-full text-left p-2 rounded border border-[#DADCE0] bg-white hover:border-[#1A73E8] hover:bg-[#F8FAFF] transition-colors focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12.5px] font-medium text-[#202124] truncate">
                              {bm.title}
                            </span>
                            {wasTagged && msg.action?.addedTag && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#137333] shrink-0">
                                <Check className="w-3 h-3" aria-hidden="true" />
                                <span>+{msg.action.addedTag}</span>
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#5F6368] truncate">
                            <span className="font-mono truncate">{formatDisplayUrl(bm.url)}</span>
                            <span>·</span>
                            <span className="shrink-0">{getFolderName(bm.folderId, folders)}</span>
                          </div>
                          {bm.tags.length > 0 && (
                            <div className="mt-1 text-[11px] text-[#1967D2] truncate">
                              {bm.tags.map((t) => `#${t}`).join(' · ')}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <span className="mt-1 px-1 text-[10.5px] text-[#80868B] tabular-nums">
                {isUser ? '你' : 'Pi Agent'} · {msg.timestamp}
              </span>
            </div>
          );
        })}
      </div>

      {/* Quick Prompts & Input Area */}
      <div className="border-t border-[#E8EAED] p-3 bg-[#FAFAFB] space-y-2.5 shrink-0">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-[#5F6368]">演示快捷指令</span>
            <label className="inline-flex items-center gap-1.5 text-[11px] text-[#5F6368] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
                className="rounded border-[#DADCE0] text-[#1A73E8]"
              />
              <span>模拟请求失败</span>
            </label>
          </div>
          <div className="flex flex-col gap-1.5">
            {DEMO_PROMPTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onSendPrompt(preset, simulateFailure)}
                className="w-full text-left px-2.5 py-1.5 text-[12px] text-[#1967D2] bg-[#E8F0FE] hover:bg-[#D2E3FC] rounded-md transition-colors truncate focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
              >
                「{preset}」
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="输入自然语言指令"
            placeholder="输入查找或整理指令..."
            className="flex-1 min-w-0 h-9 px-3 text-[13px] bg-white border border-[#DADCE0] rounded-md focus:border-[#1A73E8] focus:ring-2 focus:ring-[#D2E3FC] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="发送指令"
            className="h-9 px-3 inline-flex items-center justify-center text-white bg-[#1A73E8] rounded-md hover:bg-[#1557B0] disabled:bg-[#DADCE0] disabled:text-[#80868B] shrink-0"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </aside>
  );
}
