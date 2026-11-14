import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Trash2,
  UploadCloud,
  WifiOff,
  X,
} from 'lucide-react';
import type {
  ChromeExtensionStatus,
  FolderNode,
  PendingChange,
  WritebackStatus,
} from '../lib/types';
import { getFolderPath } from '../lib/bookmarkStore';

interface WritebackModalProps {
  pendingChanges: PendingChange[];
  folders: FolderNode[];
  chromeStatus: ChromeExtensionStatus;
  writebackStatus: WritebackStatus;
  simulateFailure: boolean;
  onToggleSimulateFailure: (value: boolean) => void;
  onConfirmWriteback: () => void;
  onOpenExtensionPreview: () => void;
  onClose: () => void;
}

export function WritebackModal({
  pendingChanges,
  folders,
  chromeStatus,
  writebackStatus,
  simulateFailure,
  onToggleSimulateFailure,
  onConfirmWriteback,
  onOpenExtensionPreview,
  onClose,
}: WritebackModalProps) {
  const deletedCount = pendingChanges.filter((c) => c.type === 'deleted').length;
  const modifiedCount = pendingChanges.filter((c) => c.type === 'modified').length;
  const addedCount = pendingChanges.filter((c) => c.type === 'added').length;

  const isExtensionBlocked = chromeStatus !== 'connected';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="writeback-dialog-title"
    >
      <div className="w-full max-w-[600px] max-h-[85vh] bg-white border border-[#DADCE0] rounded-lg shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-12 px-5 border-b border-[#E8EAED] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-[#1A73E8]" aria-hidden="true" />
            <h2 id="writeback-dialog-title" className="text-[14px] font-semibold text-[#202124]">
              写回 Chrome 书签确认
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭写回确认窗口"
            className="w-7 h-7 inline-flex items-center justify-center rounded-full text-[#5F6368] hover:bg-[#F1F3F4]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto chrome-scroll p-5 space-y-4">
          {/* Result Banner */}
          {writebackStatus === 'success' && (
            <div
              role="status"
              className="p-3.5 rounded-md bg-[#E6F4EA] border border-[#CEEAD6] flex items-start gap-2.5 text-[#137333]"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-[13px]">
                <p className="font-semibold">写回 Chrome 成功</p>
                <p className="text-[12px] mt-0.5">
                  所有本地新增、修改与删除已同步至 Chrome 书签树，本地待写回队列已清空。
                </p>
              </div>
            </div>
          )}

          {writebackStatus === 'failed' && (
            <div
              role="alert"
              className="p-3.5 rounded-md bg-[#FCE8E6] border border-[#FAD2CF] flex items-start gap-2.5 text-[#C5221F]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-[13px] flex-1">
                <p className="font-semibold">写回 Chrome 失败</p>
                <p className="text-[12px] mt-0.5 text-[#202124]">
                  扩展通信通道返回写入超时（ERR_NATIVE_HOST_TIMEOUT）。你的全部本地编辑、标签与删除清单均已完整保留，未丢失任何改动。
                </p>
              </div>
            </div>
          )}

          {isExtensionBlocked && pendingChanges.length > 0 && writebackStatus !== 'success' && (
            <div
              role="status"
              className="p-3 rounded-md bg-[#FEF7E0] border border-[#FEEFC3] flex items-start justify-between gap-3 text-[12.5px] text-[#B06000]"
            >
              <div className="flex items-start gap-2">
                <WifiOff className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold">
                    当前 Chrome 扩展{chromeStatus === 'error' ? '连接异常' : '未连接'}
                  </p>
                  <p className="text-[12px] mt-0.5">
                    无法直接写入浏览器书签树，请先在 Chrome 工具栏确认扩展连接状态。
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExtensionPreview();
                }}
                className="text-[12px] font-medium underline whitespace-nowrap shrink-0"
              >
                查看扩展状态
              </button>
            </div>
          )}

          {/* Diff Summary */}
          {pendingChanges.length === 0 && writebackStatus !== 'success' ? (
            <div className="py-10 text-center text-[13px] text-[#5F6368]">
              当前没有待写回 Chrome 的本地修改，所有书签均已同步。
            </div>
          ) : pendingChanges.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-[#5F6368]">
                <div className="tabular-nums">
                  共 <strong className="text-[#202124]">{pendingChanges.length}</strong> 项待写回变更：
                  {addedCount > 0 && <span className="ml-2 text-[#137333]">新增 {addedCount}</span>}
                  {modifiedCount > 0 && <span className="ml-2 text-[#B06000]">修改 {modifiedCount}</span>}
                  {deletedCount > 0 && (
                    <span className="ml-2 text-[#C5221F] font-semibold">删除 {deletedCount}</span>
                  )}
                </div>

                {/* Simulation switch for prototype verification */}
                <label className="inline-flex items-center gap-1.5 text-[12px] text-[#5F6368] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(e) => onToggleSimulateFailure(e.target.checked)}
                    className="rounded border-[#DADCE0] text-[#1A73E8]"
                  />
                  <span>模拟写回失败</span>
                </label>
              </div>

              {/* Change List */}
              <div className="border border-[#DADCE0] rounded-md divide-y divide-[#E8EAED]">
                {pendingChanges.map((change) => {
                  const isDelete = change.type === 'deleted';
                  const isAdd = change.type === 'added';

                  return (
                    <div
                      key={change.bookmarkId}
                      className={`p-3 text-[12.5px] ${isDelete ? 'bg-[#FFF8F7]' : 'bg-white'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {isDelete ? (
                              <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#C5221F] shrink-0">
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>将从 Chrome 删除</span>
                              </span>
                            ) : isAdd ? (
                              <span className="text-[11.5px] font-semibold text-[#137333] shrink-0">
                                [新增]
                              </span>
                            ) : (
                              <span className="text-[11.5px] font-semibold text-[#B06000] shrink-0">
                                [修改]
                              </span>
                            )}
                            <span
                              className={`font-medium truncate ${
                                isDelete ? 'line-through text-[#5F6368]' : 'text-[#202124]'
                              }`}
                            >
                              {change.bookmark.title}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-[#5F6368] truncate mt-0.5">
                            {change.bookmark.url}
                          </div>
                        </div>
                        <span className="text-[11px] text-[#5F6368] shrink-0">
                          {getFolderPath(change.bookmark.folderId, folders)}
                        </span>
                      </div>

                      {change.type === 'modified' && change.diffs.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-[#F1F3F4] space-y-1 text-[11.5px]">
                          {change.diffs.map((d) => (
                            <div key={d.field} className="grid grid-cols-[48px_1fr] gap-2">
                              <span className="text-[#5F6368]">{d.label}</span>
                              <div className="min-w-0 break-words">
                                <span className="line-through text-[#80868B] mr-2">{d.before}</span>
                                <span className="text-[#1967D2] font-medium">→ {d.after}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="h-14 px-5 border-t border-[#E8EAED] bg-[#F8F9FA] flex items-center justify-between gap-3 shrink-0">
          <span className="text-[12px] text-[#5F6368]">
            {writebackStatus === 'writing'
              ? '正在通过 Native Messaging 写入 Chrome...'
              : '仅写回以上已确认的变更项'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3.5 text-[13px] font-medium text-[#3C4043] bg-white border border-[#DADCE0] rounded-md hover:bg-[#F1F3F4]"
            >
              {writebackStatus === 'success' ? '完成' : '取消'}
            </button>

            {pendingChanges.length > 0 && writebackStatus !== 'success' && (
              <button
                type="button"
                onClick={onConfirmWriteback}
                disabled={writebackStatus === 'writing' || isExtensionBlocked}
                className={`h-8 px-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                  writebackStatus === 'failed'
                    ? 'bg-[#D93025] hover:bg-[#B31412]'
                    : 'bg-[#1A73E8] hover:bg-[#1557B0]'
                }`}
              >
                {writebackStatus === 'writing' ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>写回中...</span>
                  </>
                ) : writebackStatus === 'failed' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>重试写回 Chrome</span>
                  </>
                ) : (
                  <span>确认写回 Chrome</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
