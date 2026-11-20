import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Modal({ open, title, onClose, children, footer, className }: ModalProps) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog overlay"
        className="absolute inset-0 bg-sidebar/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative z-10 w-full max-w-lg rounded-2xl bg-surface shadow-[var(--shadow-overlay)]',
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id="modal-title" className="typo-subtitle">
            {title}
          </h2>
          <IconButton label="Close dialog" variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
