import { cn } from '@/utils/cn';

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

export function LoadingSpinner({ label = 'Loading', className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-3 py-10', className)} role="status">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-soft border-t-primary" />
      <span className="typo-secondary">{label}…</span>
    </div>
  );
}
