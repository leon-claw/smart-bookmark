import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Dialog({ title, children, close, busy = false, wide = false }: {
  title: string;
  children: ReactNode;
  close: () => void;
  busy?: boolean;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} aria-label={title} onCancel={event => {
      event.preventDefault();
      if (!busy) close();
    }} className={'m-auto max-h-[calc(100vh-32px)] rounded-xl border border-[#dadce0] bg-white text-[#202124] shadow-xl backdrop:bg-black/25 ' +
      (wide ? 'w-[min(720px,calc(100vw-32px))]' : 'w-[min(560px,calc(100vw-32px))]')}>
      <div className="flex items-center justify-between border-b border-[#dadce0] px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <button className="rounded-md p-1 hover:bg-[#f1f3f4]" onClick={close} disabled={busy} aria-label="关闭">
          <X size={18} />
        </button>
      </div>
      <div className={wide ? '' : 'p-4'}>{children}</div>
    </dialog>
  );
}
