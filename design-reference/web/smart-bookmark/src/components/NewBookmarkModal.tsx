import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { FolderNode } from '../lib/types';
import { getFolderPath, isValidBookmarkUrl } from '../lib/bookmarkStore';

interface NewBookmarkModalProps {
  folders: FolderNode[];
  defaultFolderId: string;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    url: string;
    folderId: string;
    tags: string[];
    notes: string;
  }) => void;
}

export function NewBookmarkModal({
  folders,
  defaultFolderId,
  onClose,
  onCreate,
}: NewBookmarkModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [folderId, setFolderId] = useState(defaultFolderId || folders[0]?.id || 'f-bar');
  const [tagDraft, setTagDraft] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    const clean = tagDraft.trim();
    if (!clean) return;
    if (!tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
    }
    setTagDraft('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('请输入书签标题');
      return;
    }
    if (!isValidBookmarkUrl(url)) {
      setError('请输入有效的 http:// 或 https:// 网址');
      return;
    }
    onCreate({
      title: title.trim(),
      url: url.trim(),
      folderId,
      tags,
      notes: notes.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-bookmark-title"
    >
      <div className="w-full max-w-[460px] bg-white border border-[#DADCE0] rounded-lg shadow-xl overflow-hidden">
        <div className="h-11 px-4 border-b border-[#E8EAED] flex items-center justify-between">
          <h2 id="new-bookmark-title" className="text-[14px] font-semibold text-[#202124]">
            新建本地书签
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭新建书签对话框"
            className="w-7 h-7 inline-flex items-center justify-center rounded-full text-[#5F6368] hover:bg-[#F1F3F4]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {error && (
            <div
              role="alert"
              className="px-3 py-2 rounded-md bg-[#FCE8E6] border border-[#FAD2CF] text-[12px] text-[#C5221F]"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="new-bm-title" className="block text-[12px] font-medium text-[#5F6368] mb-1">
              标题 *
            </label>
            <input
              id="new-bm-title"
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：SQLite PRAGMA 调优备忘"
              className="w-full px-3 py-1.5 text-[13px] border border-[#DADCE0] rounded-md focus:border-[#1A73E8] focus:ring-2 focus:ring-[#D2E3FC] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="new-bm-url" className="block text-[12px] font-medium text-[#5F6368] mb-1">
              网址 *
            </label>
            <input
              id="new-bm-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-1.5 text-[12.5px] font-mono border border-[#DADCE0] rounded-md focus:border-[#1A73E8] focus:ring-2 focus:ring-[#D2E3FC] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="new-bm-folder" className="block text-[12px] font-medium text-[#5F6368] mb-1">
              目标文件夹
            </label>
            <select
              id="new-bm-folder"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-3 py-1.5 text-[13px] border border-[#DADCE0] rounded-md focus:border-[#1A73E8] focus:ring-2 focus:ring-[#D2E3FC] focus:outline-none"
            >
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {getFolderPath(folder.id, folders)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="new-bm-tag" className="block text-[12px] font-medium text-[#5F6368] mb-1">
              标签
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="new-bm-tag"
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
                className="flex-1 min-w-0 px-3 py-1.5 text-[12.5px] border border-[#DADCE0] rounded-md focus:border-[#1A73E8] focus:ring-2 focus:ring-[#D2E3FC] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="h-8 px-2.5 inline-flex items-center gap-1 text-[12px] font-medium text-[#202124] bg-[#F8F9FA] border border-[#DADCE0] rounded-md hover:bg-[#F1F3F4]"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>添加</span>
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[12px] text-[#1967D2] bg-[#E8F0FE] rounded"
                  >
                    <span>#{tag}</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="new-bm-notes" className="block text-[12px] font-medium text-[#5F6368] mb-1">
              备注
            </label>
            <textarea
              id="new-bm-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="可选：补充关键内容或检索提示"
              className="w-full px-3 py-1.5 text-[13px] border border-[#DADCE0] rounded-md focus:border-[#1A73E8] focus:ring-2 focus:ring-[#D2E3FC] focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F1F3F4]">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3.5 text-[13px] font-medium text-[#3C4043] bg-white border border-[#DADCE0] rounded-md hover:bg-[#F8F9FA]"
            >
              取消
            </button>
            <button
              type="submit"
              className="h-8 px-4 text-[13px] font-medium text-white bg-[#1A73E8] rounded-md hover:bg-[#1557B0]"
            >
              保存到本地
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
