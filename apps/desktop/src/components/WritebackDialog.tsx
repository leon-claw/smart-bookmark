import { useState } from 'react';
import type { FolderNode, PendingChange } from '../lib/types';
import { getFolderPath } from '../lib/bookmarkStore';
import { Dialog } from './Dialog';

const labels = { added: '新增', modified: '修改', deleted: '删除' };

export function WritebackDialog({ changes, folders, connected, busy, result, confirm, close }: {
  changes: PendingChange[];
  folders: FolderNode[];
  connected: boolean;
  busy: boolean;
  result: { written: number; errors: string[] } | null;
  confirm: (changes: PendingChange[]) => void;
  close: () => void;
}) {
  const [selected, setSelected] = useState(() => new Set(changes.filter(change => change.type !== 'deleted').map(change => change.bookmarkId)));
  const chosen = changes.filter(change => selected.has(change.bookmarkId));
  return (
    <Dialog title="写回 Chrome" close={close} busy={busy}>
      <p className="mb-3 text-[13px] text-[#5f6368]">选择要应用到 Chrome 的书签改动。备注与标签保存在本地。</p>
      {!connected && <p role="status" className="mb-3 text-sm text-[#c5221f]">请连接 Chrome 扩展并至少导入一次。</p>}
      {result && <div role="status" className="mb-3 space-y-1 rounded-md bg-[#f1f3f4] p-3 text-[13px]">
        <p>已写回 {result.written} 条。</p>
        {result.errors.map((error, index) => <p className="text-[#c5221f]" key={index}>{error}</p>)}
      </div>}
      {!changes.length && <p className="text-sm text-[#5f6368]">没有待写回的修改。</p>}
      <ul className="chrome-scroll max-h-[45vh] overflow-auto divide-y divide-[#e8eaed]">
        {changes.map(change => <li key={change.bookmarkId} className="py-2.5">
          <label className="flex items-start gap-2.5 text-[13px]">
            <input type="checkbox" className="mt-1 accent-[#1a73e8]" disabled={busy} checked={selected.has(change.bookmarkId)}
              onChange={event => {
                const next = new Set(selected);
                if (event.target.checked) next.add(change.bookmarkId);
                else next.delete(change.bookmarkId);
                setSelected(next);
              }} />
            <span className="min-w-0">
              <span className={change.type === 'deleted' ? 'font-medium text-[#c5221f]' : 'font-medium text-[#1967d2]'}>{labels[change.type]} </span>
              <span className="break-all">{change.bookmark.title || change.bookmark.url}</span>
              <span className="block break-all text-xs text-[#5f6368]">{change.bookmark.url}</span>
              <span className="block text-xs text-[#5f6368]">{change.bookmark.folderId === 'local' && change.type !== 'deleted'
                ? '写入 Chrome 书签栏' : getFolderPath(change.bookmark.folderId, folders)}</span>
              {change.diffs.map(diff => <span key={diff.field} className="block break-all text-xs text-[#5f6368]">
                {diff.label} · {diff.before} → {diff.after}
              </span>)}
            </span>
          </label>
        </li>)}
      </ul>
      <div className="mt-4 flex justify-end gap-2">
        <button className="sb-button" onClick={close} disabled={busy}>关闭</button>
        {changes.length > 0 && <button className="sb-button sb-primary" disabled={busy || !connected || !chosen.length} onClick={() => confirm(chosen)}>
          {busy ? '正在写回…' : '写回 ' + chosen.length + ' 条'}
        </button>}
      </div>
    </Dialog>
  );
}
