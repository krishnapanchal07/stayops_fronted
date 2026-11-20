import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  side?: 'right' | 'left';
}

export function Drawer({
  open,
  title,
  onClose,
  children,
  footer,
  side = 'right',
}: DrawerProps) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50',
        open ? 'visible' : 'invisible pointer-events-none',
      )}
    >
      <button
        type="button"
        aria-label="Close drawer overlay"
        className={cn(
          'absolute inset-0 bg-sidebar/40 transition-opacity',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={cn(
          'absolute top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-[var(--shadow-overlay)] transition-transform duration-200',
          side === 'right' ? 'right-0' : 'left-0',
          open ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="drawer-title" className="typo-subtitle">
            {title}
          </h2>
          <IconButton label="Close drawer" variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-border px-5 py-4">{footer}</div> : null}
      </aside>
    </div>
  );
}
