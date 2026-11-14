import { useState, useRef, useEffect } from 'react';
import {
  Bookmark as BookmarkIcon,
  Download,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  UploadCloud,
  X,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  WifiOff,
} from 'lucide-react';
import type { ChromeExtensionStatus, ImportStatus, WritebackStatus } from '../lib/types';

interface TopToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onOpenNewBookmark: () => void;
  onStartImport: () => void;
  importStatus: ImportStatus;
  pendingCount: number;
  writebackStatus: WritebackStatus;
  onOpenWriteback: () => void;
  chromeStatus: ChromeExtensionStatus;
  onOpenExtensionPreview: () => void;
  isAgentOpen: boolean;
  onToggleAgent: () => void;
  onToggleSidebar: () => void;
  onApplyDemoScenario: (
    scenario:
      | 'default'
      | 'first_use'
      | 'ext_connected'
      | 'ext_disconnected'
      | 'ext_error'
      | 'writeback_fail_preset',
  ) => void;
}

export function TopToolbar({
  searchQuery,
  onSearchChange,
  searchInputRef,
  onOpenNewBookmark,
  onStartImport,
  importStatus,
  pendingCount,
  writebackStatus,
  onOpenWriteback,
  chromeStatus,
  onOpenExtensionPreview,
  isAgentOpen,
  onToggleAgent,
  onToggleSidebar,
  onApplyDemoScenario,
}: TopToolbarProps) {
  const [scenarioMenuOpen, setScenarioMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setScenarioMenuOpen(false);
      }
    };
    if (scenarioMenuOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [scenarioMenuOpen]);

  const statusMeta =
    chromeStatus === 'connected'
      ? {
          label: '扩展已连接',
          cls: 'text-[#137333] bg-[#E6F4EA] border-[#CEEAD6] hover:bg-[#D7EEDF]',
          Icon: CheckCircle2,
        }
      : chromeStatus === 'disconnected'
        ? {
            label: '扩展未连接',
            cls: 'text-[#5F6368] bg-[#F1F3F4] border-[#DADCE0] hover:bg-[#E8EAED]',
            Icon: WifiOff,
          }
        : {
            label: '连接异常',
            cls: 'text-[#C5221F] bg-[#FCE8E6] border-[#FAD2CF] hover:bg-[#F9D6D2]',
            Icon: AlertCircle,
          };

  const StatusIcon = statusMeta.Icon;

  return (
    <header className="h-[54px] shrink-0 bg-white border-b border-[#DADCE0] px-3 lg:px-4 flex items-center justify-between gap-3">
      {/* Brand + Narrow Sidebar Toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="切换文件夹侧栏"
          className="md:hidden h-8 w-8 inline-flex items-center justify-center rounded-md text-[#5F6368] hover:bg-[#F1F3F4] focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
          <div className="w-7 h-7 rounded-md bg-[#1A73E8] text-white flex items-center justify-center">
            <BookmarkIcon className="w-4 h-4" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-[#202124]">
            Smart Bookmark
          </span>
        </div>
      </div>

      {/* Search Box */}
      <div className="flex-1 max-w-[440px] min-w-[140px]">
        <div className="relative flex items-center">
          <Search
            className="w-4 h-4 text-[#5F6368] absolute left-3 pointer-events-none"
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="搜索书签（覆盖标题、网址、标签与备注）"
            placeholder="搜索标题、网址、标签或备注 ( / )"
            className="w-full h-9 pl-9 pr-8 text-[13px] bg-[#F1F3F4] text-[#202124] placeholder:text-[#5F6368] rounded-full border border-transparent focus:bg-white focus:border-[#1A73E8] focus:ring-2 focus:ring-[#D2E3FC] focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="清空搜索关键词"
              className="absolute right-2 w-6 h-6 inline-flex items-center justify-center rounded-full text-[#5F6368] hover:bg-[#E8EAED] hover:text-[#202124] focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onOpenNewBookmark}
          className="h-8 px-2.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#202124] bg-white border border-[#DADCE0] rounded-md hover:bg-[#F8F9FA] active:bg-[#F1F3F4] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
        >
          <Plus className="w-3.5 h-3.5 text-[#1A73E8]" aria-hidden="true" />
          <span className="hidden sm:inline">新建书签</span>
        </button>

        <button
          type="button"
          onClick={onStartImport}
          disabled={importStatus === 'importing'}
          className="h-8 px-2.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#202124] bg-white border border-[#DADCE0] rounded-md hover:bg-[#F8F9FA] disabled:opacity-60 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
        >
          <Download
            className={`w-3.5 h-3.5 text-[#5F6368] ${importStatus === 'importing' ? 'animate-bounce' : ''}`}
            aria-hidden="true"
          />
          <span className="hidden lg:inline">
            {importStatus === 'importing' ? '导入中...' : '从 Chrome 导入'}
          </span>
          <span className="lg:hidden">{importStatus === 'importing' ? '导入中' : '导入'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenWriteback}
          className={`h-8 px-2.5 inline-flex items-center gap-1.5 text-[13px] font-medium rounded-md border whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-[#1A73E8] ${
            writebackStatus === 'failed'
              ? 'bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF] hover:bg-[#F9D6D2]'
              : pendingCount > 0
                ? 'bg-[#1A73E8] text-white border-[#1A73E8] hover:bg-[#1557B0]'
                : 'bg-[#F8F9FA] text-[#5F6368] border-[#DADCE0] hover:bg-[#F1F3F4]'
          }`}
        >
          {writebackStatus === 'failed' ? (
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <UploadCloud className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          <span>
            {writebackStatus === 'failed'
              ? `写回失败 (${pendingCount})`
              : pendingCount > 0
                ? `写回 Chrome (${pendingCount})`
                : '写回 Chrome'}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenExtensionPreview}
          aria-label={`Chrome 扩展状态：${statusMeta.label}，点击预览扩展弹窗`}
          className={`h-8 px-2.5 hidden sm:inline-flex items-center gap-1.5 text-[12px] font-medium rounded-md border whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-[#1A73E8] ${statusMeta.cls}`}
        >
          <StatusIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{statusMeta.label}</span>
        </button>

        <button
          type="button"
          onClick={onToggleAgent}
          aria-expanded={isAgentOpen}
          className={`h-8 px-2.5 inline-flex items-center gap-1.5 text-[13px] font-medium rounded-md border whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-[#1A73E8] ${
            isAgentOpen
              ? 'bg-[#E8F0FE] text-[#1967D2] border-[#D2E3FC]'
              : 'bg-white text-[#202124] border-[#DADCE0] hover:bg-[#F8F9FA]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#1A73E8]" aria-hidden="true" />
          <span>Pi Agent</span>
        </button>

        {/* Demo Scenario Switcher */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setScenarioMenuOpen((v) => !v)}
            aria-expanded={scenarioMenuOpen}
            aria-haspopup="menu"
            className="h-8 px-2 inline-flex items-center gap-1 text-[12px] font-medium text-[#5F6368] bg-[#F8F9FA] border border-[#DADCE0] rounded-md hover:bg-[#F1F3F4] hover:text-[#202124] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#1A73E8]"
          >
            <span className="hidden xl:inline">演示预设</span>
            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          {scenarioMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-1.5 w-56 bg-white border border-[#DADCE0] rounded-lg shadow-lg py-1 z-40 text-[13px]"
            >
              <div className="px-3 py-1.5 text-[11px] font-medium text-[#5F6368] border-b border-[#F1F3F4]">
                快速切换演示状态
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onApplyDemoScenario('default');
                  setScenarioMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#F1F3F4] text-[#202124]"
              >
                重置为标准演示数据
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onApplyDemoScenario('first_use');
                  setScenarioMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#F1F3F4] text-[#202124]"
              >
                首次使用（空书签库）
              </button>
              <div className="my-1 border-t border-[#F1F3F4]" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onApplyDemoScenario('ext_connected');
                  setScenarioMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#F1F3F4] text-[#202124]"
              >
                扩展状态：已连接
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onApplyDemoScenario('ext_disconnected');
                  setScenarioMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#F1F3F4] text-[#202124]"
              >
                扩展状态：未连接
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onApplyDemoScenario('ext_error');
                  setScenarioMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#F1F3F4] text-[#202124]"
              >
                扩展状态：连接失败
              </button>
              <div className="my-1 border-t border-[#F1F3F4]" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onApplyDemoScenario('writeback_fail_preset');
                  setScenarioMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#F1F3F4] text-[#C5221F]"
              >
                打开扩展弹窗预览
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
