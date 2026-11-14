import { useState, useEffect } from 'react';
import {
  Check,
  ExternalLink,
  Plus,
  RotateCcw,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';
import type { Bookmark, FolderNode, PendingChange } from '../lib/types';
import { getFolderPath, isValidBookmarkUrl } from '../lib/bookmarkStore';

interface BookmarkDetailPanelProps {
  bookmark: Bookmark | null;
  folders: FolderNode[];
  pendingChange?: PendingChange;
  justSavedId: string | null;
  onSaveBookmark: (updated: {
    id: string;
    title: string;
    url: string;
    folderId: string;
    tags: string[];
    notes: string;
  }) => void;
  onRevertBookmark: (id: string) => void;
  onDeleteBookmark: (id: string) => void;
  onCloseMobile?: () => void;
}

export function BookmarkDetailPanel({
  bookmark,
  folders,
  pendingChange,
  justSavedId,
  onSaveBookmark,
  onRevertBookmark,
  onDeleteBookmark,
  onCloseMobile,
}: BookmarkDetailPanelProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [folderId, setFolderId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title);
      setUrl(bookmark.url);
      setFolderId(bookmark.folderId);
      setTags(bookmark.tags);
      setNotes(bookmark.notes);
      setTagDraft('');
      setConfirmingDelete(false);
      setValidationError(null);
    }
  }, [bookmark]);

  if (!bookmark) {
    return (
      <aside
        aria-label="书签详情面板"
        className="w-[340px] xl:w-[360px] shrink-0 border-l border-[#DADCE0] bg-[#FAFAFB] hidden md:flex flex-col items-center justify-center px-6 text-center"
      >
        <p className="text-[13px] font-medium text-[#3C4043] mb-1">未选中任何书签</p>
        <p className="text-[12px] text-[#5F6368] leading-relaxed">
          点击中间列表中的任意书签，即可在此编辑标题、网址、文件夹、标签与备注。
        </p>
      </aside>
    );
  }

  const isDirty =
    title.trim() !== bookmark.title ||
    url.trim() !== bookmark.url ||
    folderId !== bookmark.folderId ||
    notes !== bookmark.notes ||
    JSON.stringify(tags) !== JSON.stringify(bookmark.tags);

  const handleAddTag = () => {
    const clean = tagDraft.trim();
    if (!clean) return;
    if (!tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
    }
    setTagDraft('');
  };

  const handleRemoveTag = (target: string) => {
    setTags((prev) => prev.filter((t) => t !== target));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('请输入书签标题');
      return;
    }
    if (!isValidBookmarkUrl(url)) {
      setValidationError('请输入有效的 http:// 或 https:// 网址');
      return;
    }
    setValidationError(null);
    onSaveBookmark({
      id: bookmark.id,
      title: title.trim(),
      url: url.trim(),
      folderId,
      tags,
      notes,
    });
  };

  const showSavedLocally = justSavedId === bookmark.id || Boolean(pendingChange);

  return (
    <aside
      aria-label="书签详情编辑面板"
      className="w-full md:w-[340px] xl:w-[360px] shrink-0 border-l border-[#DADCE0] bg-white flex flex-col h-full"
    >
      {/* Header */}
      <div className="h-9 shrink-0 px-4 border-b border-[#E8EAED] flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-[13px] font-semibold text-[#202124]">书签详情</h2>
          {showSavedLocally && (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#137333]">
              <Check className="w-3 h-3" aria-hidden="true" />
              <span>已保存到本地</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <a
            href={isValidBookmarkUrl(bookmark.url) ? bookmark.url : '#'}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`在新标签页打开 ${bookmark.title}`}
            className="h-7 px-2 inline-flex items-center gap-1 text-[12px] text-[#1A73E8] hover:bg-[#E8F0FE] rounded transition-colors focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
          >
            <span>打开</span>
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="关闭详情面板"
              className="md:hidden h-7 w-7 inline-flex items-center justify-center rounded text-[#5F6368] hover:bg-[#F1F3F4]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto chrome-scroll p-4 space-y-3.5">
        {validationError && (
          <div
            role="alert"
            className="px-3 py-2 rounded-md bg-[#FCE8E6] border border-[#FAD2CF] text-[12px] text-[#C5221F]"
          >
            {validationError}
          </div>
        )}

        <div>
          <label
            htmlFor="detail-title"
            className="block text-[12px] font-medium text-[#5F6368] mb-1"
          >
            标题
          </label>
          <input
            id="detail-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-2.5 py-1.5 text-[13px] text-[#202124] bg-white border border-[#DADCE0] rounded-md focus:border-[#1A73E8] focus:ring-2 focus:ring-[#D2E3FC] focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="detail-url"
            className="block text-[12px] font-medium text-[#5F6368] mb-1"
          >
            网址
          </label>
          <input
            id="detail-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-2.5 py-1.5 text-[12px] font-mono text-[#202124] bg-white border border-[#DADCE0] rounded-md focus:border-[#1A73E8] focus:ring-2 focus:ring-[#D2E3FC] focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="detail-folder"
            className="block text-[12px] font-medium text-[#5F6368] mb-1"
          >
            Chrome 文件夹
          </label>
          <select
            id="detail-folder"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="w-full px-2.5 py-1.5 text-[13px] text-[#202124] bg-white border border-[#DADCE0] rounded-md focus:border-[#1A73E8] focus:ring-2 focus:ring-[#D2E3FC] focus:outline-none"
          >
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {getFolderPath(folder.id, folders)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="detail-tag-input"
            className="block text-[12px] font-medium text-[#5F6368] mb-1"
          >
            标签
          </label>
          <div className="flex items-center gap-1.5 mb-2">
            <input
              id="detail-tag-input"
              type="text"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="输入标签后回车添加"
              className="flex-1 min-w-0 px-2.5 py-1.5 text-[12.5px] text-[#202124] bg-white border border-[#DADCE0] rounded-md focus:border-[#1A73E8] focus:ring-2 focus:ring-[#D2E3FC] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddTag}
              aria-label="添加标签"
              className="h-8 px-2.5 inline-flex items-center gap-1 text-[12px] font-medium text-[#202124] bg-[#F8F9FA] border border-[#DADCE0] rounded-md hover:bg-[#F1F3F4] shrink-0 focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>添加</span>
            </button>
          </div>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  aria-label={`移除标签 ${tag}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[12px] text-[#1967D2] bg-[#E8F0FE] hover:bg-[#D2E3FC] rounded transition-colors focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
                >
                  <span>#{tag}</span>
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-[#80868B]">暂无标签</p>
          )}
        </div>

        <div>
          <label
            htmlFor="detail-notes"
            className="block text-[12px] font-medium text-[#5F6368] mb-1"
          >
            备注
          </label>
          <textarea
            id="detail-notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="记录阅读要点、适用场景或检索关键词..."
            className="w-full px-2.5 py-1.5 text-[13px] leading-relaxed text-[#202124] bg-white border border-[#DADCE0] rounded-md resize-y focus:border-[#1A73E8] focus:ring-2 focus:ring-[#D2E3FC] focus:outline-none"
          />
        </div>

        {/* Timestamps */}
        <div className="pt-2 border-t border-[#F1F3F4] text-[11.5px] text-[#5F6368] space-y-1 tabular-nums">
          <div className="flex justify-between">
            <span>创建时间</span>
            <span className="font-mono">{bookmark.createdAt}</span>
          </div>
          <div className="flex justify-between">
            <span>本地更新时间</span>
            <span className="font-mono">{bookmark.updatedAt}</span>
          </div>
        </div>

        {/* Delete Confirmation Box */}
        {confirmingDelete && (
          <div
            role="alertdialog"
            aria-labelledby="delete-confirm-heading"
            className="p-3 rounded-md bg-[#FCE8E6] border border-[#FAD2CF] space-y-2"
          >
            <div className="flex items-start gap-2 text-[#C5221F]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <p id="delete-confirm-heading" className="text-[12.5px] font-semibold">
                  确认删除以下受影响书签？
                </p>
                <p className="text-[12px] text-[#202124] font-medium mt-1 break-words">
                  {bookmark.title}
                </p>
                <p className="text-[11px] font-mono text-[#5F6368] break-all">
                  {bookmark.url}
                </p>
                <p className="text-[11.5px] text-[#C5221F] mt-1">
                  删除后先保存在本地待写回列表，执行「写回 Chrome」后才会从浏览器移除。
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="h-7 px-2.5 text-[12px] font-medium text-[#3C4043] bg-white border border-[#DADCE0] rounded hover:bg-[#F8F9FA]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => onDeleteBookmark(bookmark.id)}
                className="h-7 px-2.5 text-[12px] font-medium text-white bg-[#D93025] rounded hover:bg-[#B31412]"
              >
                确认删除「{bookmark.title.slice(0, 10)}
                {bookmark.title.length > 10 ? '…' : ''}」
              </button>
            </div>
          </div>
        )}

        {/* Primary & Secondary Action Footer */}
        <div className="pt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {!confirmingDelete && (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                aria-label={`删除书签 ${bookmark.title}`}
                className="h-8 px-2.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-[#C5221F] bg-white border border-[#FAD2CF] rounded-md hover:bg-[#FCE8E6] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#D93025]"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>删除</span>
              </button>
            )}

            {pendingChange?.type === 'modified' && (
              <button
                type="button"
                onClick={() => onRevertBookmark(bookmark.id)}
                title="恢复到 Chrome 上次同步时的内容"
                className="h-8 px-2.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-[#5F6368] bg-white border border-[#DADCE0] rounded-md hover:bg-[#F8F9FA] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>还原</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!isDirty}
            className="h-8 px-4 text-[13px] font-medium text-white bg-[#1A73E8] rounded-md hover:bg-[#1557B0] disabled:bg-[#DADCE0] disabled:text-[#80868B] disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
          >
            保存到本地
          </button>
        </div>
      </form>
    </aside>
  );
}
