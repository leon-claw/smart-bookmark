import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FolderOpen,
  Globe,
  Plus,
  SearchX,
  Sparkles,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import type {
  Bookmark,
  ChromeExtensionStatus,
  FolderNode,
  ImportStatus,
  PendingChange,
  SidebarScope,
} from '../lib/types';
import { formatDisplayUrl, getFolderName, getFolderPath } from '../lib/bookmarkStore';

interface BookmarkListProps {
  totalBookmarkCount: number;
  bookmarks: Bookmark[];
  folders: FolderNode[];
  scope: SidebarScope;
  searchQuery: string;
  selectedId: string | null;
  onSelectBookmark: (id: string) => void;
  pendingChangesMap: Map<string, PendingChange>;
  deletedPendingList: PendingChange[];
  onRestoreDeleted: (bookmarkId: string) => void;
  onClearFilters: () => void;
  onOpenNewBookmark: () => void;
  onStartImport: () => void;
  onOpenAgent: () => void;
  importStatus: ImportStatus;
  importedCount: number;
  onDismissImportNotice: () => void;
  chromeStatus: ChromeExtensionStatus;
  onOpenExtensionPreview: () => void;
  onOpenWriteback: () => void;
}

export function BookmarkList({
  totalBookmarkCount,
  bookmarks,
  folders,
  scope,
  searchQuery,
  selectedId,
  onSelectBookmark,
  pendingChangesMap,
  deletedPendingList,
  onRestoreDeleted,
  onClearFilters,
  onOpenNewBookmark,
  onStartImport,
  onOpenAgent,
  importStatus,
  importedCount,
  onDismissImportNotice,
  chromeStatus,
  onOpenExtensionPreview,
  onOpenWriteback,
}: BookmarkListProps) {
  const scopeTitle = (() => {
    if (scope.kind === 'all') return '全部书签';
    if (scope.kind === 'pending') return '待写回修改';
    if (scope.kind === 'tag') return `标签：${scope.tag}`;
    return getFolderPath(scope.folderId, folders);
  })();

  const hasActiveFilter = scope.kind !== 'all' || searchQuery.trim().length > 0;

  const handleRowKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = bookmarks[index + 1];
      if (next) {
        onSelectBookmark(next.id);
        const el = document.getElementById(`bookmark-row-${next.id}`);
        el?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = bookmarks[index - 1];
      if (prev) {
        onSelectBookmark(prev.id);
        const el = document.getElementById(`bookmark-row-${prev.id}`);
        el?.focus();
      }
    }
  };

  return (
    <main className="flex-1 min-w-0 bg-white flex flex-col h-full">
      {/* Contextual Subheader */}
      <div className="h-9 shrink-0 px-4 border-b border-[#E8EAED] flex items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2 min-w-0 text-[12.5px]">
          <span className="font-medium text-[#202124] truncate">{scopeTitle}</span>
          {searchQuery.trim() && (
            <span className="text-[#5F6368] truncate">
              · 搜索「{searchQuery.trim()}」
            </span>
          )}
          <span className="text-[#5F6368] tabular-nums shrink-0">
            · {bookmarks.length} 条
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasActiveFilter && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-[12px] text-[#1A73E8] hover:underline whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#1A73E8] rounded px-1"
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* Inline Contextual Banners */}
      {importStatus === 'importing' && (
        <div
          role="status"
          className="px-4 py-2 bg-[#E8F0FE] border-b border-[#D2E3FC] flex items-center justify-between gap-3 text-[12.5px] text-[#1967D2]"
        >
          <div className="flex items-center gap-2">
            <span className="inline-block w-3.5 h-3.5 border-2 border-[#1967D2] border-t-transparent rounded-full animate-spin" />
            <span>正在从 Chrome 书签栏读取文件夹结构并去重导入...</span>
          </div>
          <span className="font-mono-nums text-[12px]">同步读取中</span>
        </div>
      )}

      {importStatus === 'success' && (
        <div
          role="status"
          className="px-4 py-2 bg-[#E6F4EA] border-b border-[#CEEAD6] flex items-center justify-between gap-3 text-[12.5px] text-[#137333]"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {importedCount > 0
                ? `导入成功：已从 Chrome 新增 ${importedCount} 条书签到本地工作区。`
                : '导入完成：本地书签已是最新，无需重复导入。'}
            </span>
          </div>
          <button
            type="button"
            onClick={onDismissImportNotice}
            aria-label="关闭导入提示"
            className="p-0.5 rounded hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#137333]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {chromeStatus !== 'connected' && totalBookmarkCount > 0 && (
        <div
          role="status"
          className={`px-4 py-2 border-b flex items-center justify-between gap-3 text-[12.5px] ${
            chromeStatus === 'error'
              ? 'bg-[#FCE8E6] border-[#FAD2CF] text-[#C5221F]'
              : 'bg-[#FEF7E0] border-[#FEEFC3] text-[#9A5200]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {chromeStatus === 'error'
                ? 'Chrome 扩展连接异常：无法建立本地通信，本地编辑仍可正常保存。'
                : 'Chrome 扩展未连接：当前修改仅保存在本地，连接扩展后可写回浏览器。'}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenExtensionPreview}
            className="text-[12px] font-medium underline whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#1A73E8] rounded px-1"
          >
            查看连接指引
          </button>
        </div>
      )}

      {/* Column Headers (shown when there are bookmarks to list) */}
      {bookmarks.length > 0 && (
        <div className="h-8 shrink-0 px-4 border-b border-[#E8EAED] bg-[#FAFAFB] flex items-center gap-3 text-[11.5px] font-medium text-[#5F6368] select-none">
          <div className="flex-[2] min-w-[160px]">标题</div>
          <div className="flex-[1.5] min-w-[140px] hidden lg:block">网址</div>
          <div className="w-[116px] shrink-0 hidden xl:block">文件夹</div>
          <div className="w-[140px] shrink-0 hidden md:block">标签</div>
          <div className="w-[64px] shrink-0 text-right">状态</div>
        </div>
      )}

      {/* List Body / Empty States */}
      <div className="flex-1 overflow-y-auto chrome-scroll" role="listbox" aria-label="书签列表">
        {totalBookmarkCount === 0 && deletedPendingList.length === 0 ? (
          /* First-use Empty State */
          <div className="h-full flex flex-col items-center justify-center px-6 py-12 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mb-4">
              <FolderOpen className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="text-[16px] font-semibold text-[#202124] mb-1.5">
              欢迎使用 Smart Bookmark
            </h2>
            <p className="text-[13px] text-[#5F6368] leading-relaxed mb-5">
              当前本地书签库为空。你可以先从 Chrome 一键导入现有书签，或直接新建第一条书签开始整理备注与标签。
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={onStartImport}
                className="h-9 px-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-[#1A73E8] rounded-md hover:bg-[#1557B0] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#1A73E8] focus-visible:outline-offset-2"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>从 Chrome 导入书签</span>
              </button>
              <button
                type="button"
                onClick={onOpenNewBookmark}
                className="h-9 px-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#202124] bg-white border border-[#DADCE0] rounded-md hover:bg-[#F8F9FA] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
              >
                <Plus className="w-4 h-4 text-[#1A73E8]" aria-hidden="true" />
                <span>新建书签</span>
              </button>
            </div>
          </div>
        ) : bookmarks.length === 0 && !(scope.kind === 'pending' && deletedPendingList.length > 0) ? (
          /* Search No Results or Empty Filter */
          <div className="h-full flex flex-col items-center justify-center px-6 py-12 text-center max-w-md mx-auto">
            <div className="w-11 h-11 rounded-full bg-[#F1F3F4] text-[#5F6368] flex items-center justify-center mb-3.5">
              <SearchX className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="text-[15px] font-semibold text-[#202124] mb-1">
              {searchQuery.trim()
                ? `未找到与「${searchQuery.trim()}」匹配的书签`
                : scope.kind === 'pending'
                  ? '暂无待写回的本地修改'
                  : '当前分类下暂无书签'}
            </h2>
            <p className="text-[13px] text-[#5F6368] leading-relaxed mb-4">
              {searchQuery.trim()
                ? '已检索所有书签的标题、网址、标签和备注。建议尝试更短的关键词，或清除筛选条件。'
                : scope.kind === 'pending'
                  ? '所有本地书签当前已与 Chrome 保持一致，编辑或新建书签后会在此列出。'
                  : '你可以新建书签并归入此文件夹，或返回查看全部书签。'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="h-8 px-3.5 text-[13px] font-medium text-white bg-[#1A73E8] rounded-md hover:bg-[#1557B0] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
                >
                  显示全部书签
                </button>
              )}
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={onOpenAgent}
                  className="h-8 px-3.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#202124] bg-white border border-[#DADCE0] rounded-md hover:bg-[#F8F9FA] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#1A73E8]" aria-hidden="true" />
                  <span>打开 Pi Agent 查找</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            {bookmarks.map((bm, index) => {
              const isSelected = bm.id === selectedId;
              const pending = pendingChangesMap.get(bm.id);
              const folderLabel = getFolderName(bm.folderId, folders);
              const displayUrl = formatDisplayUrl(bm.url);
              const hostInitial = displayUrl.charAt(0).toUpperCase() || 'W';

              return (
                <button
                  key={bm.id}
                  id={`bookmark-row-${bm.id}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onSelectBookmark(bm.id)}
                  onKeyDown={(e) => handleRowKeyDown(e, index)}
                  className={`w-full text-left h-10 px-4 border-b border-[#F1F3F4] flex items-center gap-3 transition-colors focus-visible:outline-2 focus-visible:outline-[#1A73E8] focus-visible:-outline-offset-2 ${
                    isSelected
                      ? 'bg-[#E8F0FE] text-[#1967D2]'
                      : 'bg-white text-[#202124] hover:bg-[#F8F9FA]'
                  }`}
                >
                  {/* Title + Domain Glyph */}
                  <div className="flex-[2] min-w-[160px] flex items-center gap-2.5 overflow-hidden">
                    <span
                      className={`w-4 h-4 rounded-[3px] shrink-0 inline-flex items-center justify-center text-[10px] font-mono font-medium ${
                        isSelected
                          ? 'bg-[#D2E3FC] text-[#174EA6]'
                          : 'bg-[#F1F3F4] text-[#5F6368]'
                      }`}
                      aria-hidden="true"
                    >
                      {hostInitial}
                    </span>
                    <span
                      title={bm.title}
                      className={`text-[13px] truncate ${
                        isSelected ? 'font-semibold text-[#174EA6]' : 'font-medium text-[#202124]'
                      }`}
                    >
                      {bm.title}
                    </span>
                  </div>

                  {/* URL */}
                  <div
                    title={bm.url}
                    className="flex-[1.5] min-w-[140px] hidden lg:flex items-center gap-1 text-[12px] font-mono text-[#5F6368] truncate"
                  >
                    <Globe className="w-3 h-3 shrink-0 text-[#80868B]" aria-hidden="true" />
                    <span className="truncate">{displayUrl}</span>
                  </div>

                  {/* Folder */}
                  <div
                    title={getFolderPath(bm.folderId, folders)}
                    className="w-[116px] shrink-0 hidden xl:block text-[12px] text-[#5F6368] truncate"
                  >
                    {folderLabel}
                  </div>

                  {/* Tags (Zero-pill clean unboxed metadata) */}
                  <div
                    title={bm.tags.join(' · ')}
                    className="w-[140px] shrink-0 hidden md:block text-[12px] text-[#5F6368] truncate"
                  >
                    {bm.tags.length > 0 ? bm.tags.join(' · ') : '—'}
                  </div>

                  {/* Local Change State */}
                  <div className="w-[64px] shrink-0 text-right text-[11.5px] tabular-nums">
                    {pending?.type === 'added' ? (
                      <span className="font-medium text-[#137333]">新增</span>
                    ) : pending?.type === 'modified' ? (
                      <span className="font-medium text-[#B06000]">已改</span>
                    ) : (
                      <span className="text-[#80868B]">已同步</span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Pending Deletions Section (visible when viewing pending or all if deletions exist) */}
            {deletedPendingList.length > 0 &&
              (scope.kind === 'pending' || scope.kind === 'all') &&
              !searchQuery.trim() && (
                <div className="mt-2 border-t border-[#DADCE0] bg-[#FFF8F7]">
                  <div className="px-4 py-2 flex items-center justify-between text-[12px] text-[#C5221F] font-medium border-b border-[#FAD2CF]">
                    <div className="flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>待写回删除（{deletedPendingList.length} 项将在写回 Chrome 时移除）</span>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenWriteback}
                      className="text-[12px] underline hover:text-[#961B18]"
                    >
                      去确认写回
                    </button>
                  </div>
                  {deletedPendingList.map((item) => (
                    <div
                      key={item.bookmarkId}
                      className="px-4 h-9 flex items-center justify-between gap-3 border-b border-[#FCE8E6] text-[12.5px]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[#C5221F] font-medium shrink-0">[待删]</span>
                        <span className="line-through text-[#5F6368] truncate">
                          {item.bookmark.title}
                        </span>
                        <span className="hidden lg:inline font-mono text-[11.5px] text-[#80868B] truncate">
                          {formatDisplayUrl(item.bookmark.url)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRestoreDeleted(item.bookmarkId)}
                        className="inline-flex items-center gap-1 text-[12px] text-[#1A73E8] hover:underline whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#1A73E8] rounded px-1"
                      >
                        <Undo2 className="w-3 h-3" aria-hidden="true" />
                        <span>撤销删除</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>
    </main>
  );
}
