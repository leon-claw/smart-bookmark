import {
  AlertCircle,
  Bookmark as BookmarkIcon,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  WifiOff,
  X,
} from 'lucide-react';
import type { ChromeExtensionStatus } from '../lib/types';

interface ExtensionPopupModalProps {
  status: ChromeExtensionStatus;
  onChangeStatus: (status: ChromeExtensionStatus) => void;
  pendingCount: number;
  onClose: () => void;
}

export function ExtensionPopupModal({
  status,
  onChangeStatus,
  pendingCount,
  onClose,
}: ExtensionPopupModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ext-preview-title"
    >
      <div className="flex flex-col items-center gap-3 w-full max-w-[400px]">
        {/* Preview State Switcher Bar */}
        <div className="w-full bg-white border border-[#DADCE0] rounded-lg px-3 py-2 flex items-center justify-between gap-2 shadow-sm">
          <span className="text-[12px] font-medium text-[#5F6368]">切换状态预览：</span>
          <div className="flex items-center gap-1 bg-[#F1F3F4] p-0.5 rounded-md">
            {(
              [
                { id: 'connected', label: '已连接' },
                { id: 'disconnected', label: '未连接' },
                { id: 'error', label: '连接失败' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeStatus(item.id)}
                className={`px-2.5 py-1 text-[12px] font-medium rounded transition-colors ${
                  status === item.id
                    ? 'bg-white text-[#202124] shadow-xs'
                    : 'text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭扩展弹窗预览"
            className="w-7 h-7 inline-flex items-center justify-center rounded-full text-[#5F6368] hover:bg-[#F1F3F4]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Simulated Chrome Extension Popup Window (360px fixed desktop width) */}
        <div className="w-full max-w-[360px] bg-white border border-[#DADCE0] rounded-lg shadow-xl overflow-hidden">
          {/* Popup Header */}
          <div className="h-11 px-3.5 border-b border-[#E8EAED] bg-[#F8F9FA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#1A73E8] text-white flex items-center justify-center">
                <BookmarkIcon className="w-3 h-3" aria-hidden="true" />
              </div>
              <h2 id="ext-preview-title" className="text-[13px] font-semibold text-[#202124]">
                Smart Bookmark 扩展
              </h2>
            </div>

            {status === 'connected' && (
              <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#137333]">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>桌面端已连接</span>
              </span>
            )}
            {status === 'disconnected' && (
              <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#5F6368]">
                <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
                <span>桌面端未连接</span>
              </span>
            )}
            {status === 'error' && (
              <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#C5221F]">
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>连接失败</span>
              </span>
            )}
          </div>

          {/* Popup Body by State */}
          <div className="p-3.5 space-y-3 text-[12.5px]">
            {status === 'connected' && (
              <>
                <div className="p-2.5 rounded-md bg-[#E6F4EA] border border-[#CEEAD6] text-[#137333]">
                  <p className="font-medium">已连接到 Windows 桌面端工作区</p>
                  <p className="text-[11.5px] mt-0.5 text-[#1E4620] tabular-nums">
                    {pendingCount > 0
                      ? `桌面端有 ${pendingCount} 项本地修改等待写回确认`
                      : '当前 Chrome 书签树与桌面端保持同步'}
                  </p>
                </div>

                <div className="border border-[#E8EAED] rounded-md p-2.5 space-y-1.5">
                  <div className="text-[11px] font-medium text-[#5F6368]">当前浏览器标签页</div>
                  <div className="text-[12.5px] font-medium text-[#202124] truncate">
                    SQLite Query Planner Overview
                  </div>
                  <div className="text-[11px] font-mono text-[#5F6368] truncate">
                    https://www.sqlite.org/queryplanner.html
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 h-8 px-3 text-[12.5px] font-medium text-white bg-[#1A73E8] rounded-md hover:bg-[#1557B0] inline-flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>打开桌面管理端</span>
                  </button>
                </div>
              </>
            )}

            {status === 'disconnected' && (
              <>
                <div className="p-2.5 rounded-md bg-[#F8F9FA] border border-[#DADCE0] text-[#3C4043]">
                  <p className="font-medium text-[#202124]">未检测到运行中的桌面端</p>
                  <p className="text-[12px] text-[#5F6368] mt-1 leading-relaxed">
                    Smart Bookmark 桌面端尚未启动，当前无法接收写回指令或实时同步标签备注。
                  </p>
                </div>

                <div className="space-y-1.5 text-[12px] text-[#3C4043]">
                  <div className="font-medium text-[#202124]">操作指引：</div>
                  <p>1. 在 Windows 启动 Smart Bookmark 桌面应用。</p>
                  <p>2. 确认托盘图标显示运行中后，点击下方重试。</p>
                </div>

                <button
                  type="button"
                  onClick={() => onChangeStatus('connected')}
                  className="w-full h-8 px-3 text-[12.5px] font-medium text-white bg-[#1A73E8] rounded-md hover:bg-[#1557B0] inline-flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>重新检测桌面端连接</span>
                </button>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="p-2.5 rounded-md bg-[#FCE8E6] border border-[#FAD2CF] text-[#C5221F]">
                  <p className="font-medium">Native Messaging 本地通道握手失败</p>
                  <p className="text-[11.5px] font-mono text-[#5F6368] mt-1">
                    ERR_NATIVE_HOST_NOT_FOUND
                  </p>
                </div>

                <div className="space-y-1.5 text-[12px] text-[#3C4043]">
                  <div className="font-medium text-[#202124]">排查建议：</div>
                  <p>1. 在桌面端「设置」重新注册 Chrome Native Host。</p>
                  <p>2. 若刚更新桌面端版本，请重启 Chrome 后再试。</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeStatus('connected')}
                    className="flex-1 h-8 px-3 text-[12.5px] font-medium text-white bg-[#D93025] rounded-md hover:bg-[#B31412] inline-flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>重试连接</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-8 px-3 text-[12.5px] font-medium text-[#3C4043] bg-white border border-[#DADCE0] rounded-md hover:bg-[#F8F9FA]"
                  >
                    关闭
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
