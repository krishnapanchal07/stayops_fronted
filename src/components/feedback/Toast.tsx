import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { dismissToast } from '@/store/slices/uiSlice';
import type { ToastVariant } from '@/types/ui';
import { cn } from '@/utils/cn';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useEffect } from 'react';

const styles: Record<ToastVariant, string> = {
  success: 'border-success/20 bg-white',
  error: 'border-danger/20 bg-white',
  info: 'border-info/20 bg-white',
  warning: 'border-warning/20 bg-white',
};

const iconStyles: Record<ToastVariant, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-info',
  warning: 'text-warning',
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const className = cn('h-5 w-5', iconStyles[variant]);
  if (variant === 'success') return <CheckCircle2 className={className} />;
  if (variant === 'error') return <XCircle className={className} />;
  if (variant === 'warning') return <AlertTriangle className={className} />;
  return <Info className={className} />;
}

export function ToastViewport() {
  const toasts = useAppSelector((state) => state.ui.toasts);
  const dispatch = useAppDispatch();

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(100%-2rem,360px)] flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
          onDismiss={() => dispatch(dismissToast(toast.id))}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  onDismiss: () => void;
}

function ToastItem({ variant, title, description, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 4000);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        'pointer-events-auto flex gap-3 rounded-2xl border p-4 shadow-[var(--shadow-overlay)]',
        styles[variant],
      )}
      role="status"
    >
      <ToastIcon variant={variant} />
      <div className="flex-1">
        <p className="text-sm font-semibold text-text">{title}</p>
        {description ? <p className="typo-helper mt-1">{description}</p> : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        className="text-muted hover:text-text"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
