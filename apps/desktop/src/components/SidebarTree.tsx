import { useState } from 'react';
import {
  Bookmark as BookmarkIcon,
  ChevronDown,
  ChevronRight,
  Clock,
  Folder,
  FolderOpen,
  Hash,
  Puzzle,
} from 'lucide-react';
import type { Bookmark, FolderNode, SidebarScope } from '../lib/types';
import { getDescendantFolderIds } from '../lib/bookmarkStore';

interface SidebarTreeProps {
  folders: FolderNode[];
  bookmarks: Bookmark[];
  allTags: { tag: string; count: number }[];
  scope: SidebarScope;
  onSelectScope: (scope: SidebarScope) => void;
  pendingCount: number;
  onOpenExtensionPreview: () => void;
}

export function SidebarTree({
  folders,
  bookmarks,
  allTags,
  scope,
  onSelectScope,
  pendingCount,
  onOpenExtensionPreview,
}: SidebarTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(['chrome:1', 'chrome:2']),
  );

  const toggleExpand = (folderId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const countInFolder = (folderId: string) => {
    const ids = getDescendantFolderIds(folderId, folders);
    return bookmarks.filter((b) => ids.has(b.folderId)).length;
  };

  const renderFolderBranch = (parentId: string | null, depth: number) => {
    const children = folders.filter((f) => f.parentId === parentId);
    if (children.length === 0) return null;

    return children.map((folder) => {
      const hasChildren = folders.some((f) => f.parentId === folder.id);
      const isExpanded = expandedIds.has(folder.id);
      const isActive = scope.kind === 'folder' && scope.folderId === folder.id;
      const count = countInFolder(folder.id);

      return (
        <div key={folder.id}>
          <div
            className={`group flex items-center h-8 pr-2 rounded-r-full text-[13px] transition-colors ${
              isActive
                ? 'bg-[#E8F0FE] text-[#1967D2] font-medium'
                : 'text-[#3C4043] hover:bg-[#EFEFF1]'
            }`}
            style={{ paddingLeft: `${8 + depth * 14}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(folder.id);
                }}
                aria-label={`${isExpanded ? '折叠' : '展开'} ${folder.name}`}
                aria-expanded={isExpanded}
                className="w-5 h-5 mr-0.5 inline-flex items-center justify-center rounded text-[#5F6368] hover:bg-black/5 shrink-0 focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-5 mr-0.5 shrink-0" aria-hidden="true" />
            )}

            <button
              type="button"
              onClick={() => onSelectScope({ kind: 'folder', folderId: folder.id })}
              className="flex-1 min-w-0 flex items-center gap-2 h-full text-left focus-visible:outline-2 focus-visible:outline-[#1A73E8] rounded"
            >
              {isActive || (hasChildren && isExpanded) ? (
                <FolderOpen
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1967D2]' : 'text-[#5F6368]'}`}
                  aria-hidden="true"
                />
              ) : (
                <Folder
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1967D2]' : 'text-[#5F6368]'}`}
                  aria-hidden="true"
                />
              )}
              <span className="truncate">{folder.name}</span>
              <span
                className={`ml-auto text-[11px] tabular-nums shrink-0 ${
                  isActive ? 'text-[#1967D2]' : 'text-[#5F6368]'
                }`}
              >
                {count}
              </span>
            </button>
          </div>
          {hasChildren && isExpanded && <div>{renderFolderBranch(folder.id, depth + 1)}</div>}
        </div>
      );
    });
  };

  return (
    <nav
      aria-label="书签文件夹与标签导航"
      className="w-[244px] shrink-0 bg-[#F8F9FA] border-r border-[#DADCE0] flex flex-col h-full select-none"
    >
      <div className="flex-1 overflow-y-auto chrome-scroll py-2.5 pr-2">
        {/* Primary Views */}
        <div className="space-y-0.5 mb-4">
          <button
            type="button"
            onClick={() => onSelectScope({ kind: 'all' })}
            className={`w-full flex items-center gap-2.5 h-8 pl-4 pr-3 rounded-r-full text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-[#1A73E8] ${
              scope.kind === 'all'
                ? 'bg-[#E8F0FE] text-[#1967D2] font-medium'
                : 'text-[#3C4043] hover:bg-[#EFEFF1]'
            }`}
          >
            <BookmarkIcon
              className={`w-4 h-4 shrink-0 ${
                scope.kind === 'all' ? 'text-[#1967D2]' : 'text-[#5F6368]'
              }`}
              aria-hidden="true"
            />
            <span className="truncate">全部书签</span>
            <span className="ml-auto text-[11px] tabular-nums">{bookmarks.length}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectScope({ kind: 'pending' })}
            className={`w-full flex items-center gap-2.5 h-8 pl-4 pr-3 rounded-r-full text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-[#1A73E8] ${
              scope.kind === 'pending'
                ? 'bg-[#E8F0FE] text-[#1967D2] font-medium'
                : 'text-[#3C4043] hover:bg-[#EFEFF1]'
            }`}
          >
            <Clock
              className={`w-4 h-4 shrink-0 ${
                pendingCount > 0 ? 'text-[#B06000]' : 'text-[#5F6368]'
              }`}
              aria-hidden="true"
            />
            <span className="truncate">待写回修改</span>
            <span
              className={`ml-auto text-[11px] tabular-nums ${
                pendingCount > 0 ? 'text-[#B06000] font-semibold' : 'text-[#5F6368]'
              }`}
            >
              {pendingCount}
            </span>
          </button>
        </div>

        {/* Folder Tree */}
        <div className="mb-4">
          <div className="px-4 pb-1.5 text-[11px] font-semibold text-[#5F6368] tracking-wide">
            Chrome 文件夹
          </div>
          <div className="space-y-0.5">{renderFolderBranch(null, 0)}</div>
        </div>

        {/* Tags */}
        <div>
          <div className="px-4 pb-1.5 text-[11px] font-semibold text-[#5F6368] tracking-wide">
            标签筛选
          </div>
          {allTags.length === 0 ? (
            <div className="px-4 py-2 text-[12px] text-[#80868B]">暂无标签</div>
          ) : (
            <div className="space-y-0.5">
              {allTags.map(({ tag, count }) => {
                const isActive = scope.kind === 'tag' && scope.tag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      onSelectScope(isActive ? { kind: 'all' } : { kind: 'tag', tag })
                    }
                    className={`w-full flex items-center gap-2 h-7 pl-4 pr-3 rounded-r-full text-[12.5px] transition-colors focus-visible:outline-2 focus-visible:outline-[#1A73E8] ${
                      isActive
                        ? 'bg-[#E8F0FE] text-[#1967D2] font-medium'
                        : 'text-[#3C4043] hover:bg-[#EFEFF1]'
                    }`}
                  >
                    <Hash
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-[#1967D2]' : 'text-[#80868B]'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{tag}</span>
                    <span className="ml-auto text-[11px] tabular-nums text-[#5F6368]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Extension Entry */}
      <div className="border-t border-[#DADCE0] p-2.5 bg-[#F8F9FA]">
        <button
          type="button"
          onClick={onOpenExtensionPreview}
          className="w-full h-8 px-2.5 flex items-center gap-2 rounded-md text-[12px] font-medium text-[#3C4043] hover:bg-[#EFEFF1] transition-colors focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
        >
          <Puzzle className="w-3.5 h-3.5 text-[#5F6368] shrink-0" aria-hidden="true" />
          <span className="truncate">Chrome 扩展连接</span>
        </button>
      </div>
    </nav>
  );
}
