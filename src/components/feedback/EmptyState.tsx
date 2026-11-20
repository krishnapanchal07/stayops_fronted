import { Button } from '@/components/ui/Button';
import { FolderOpen } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({
  title = 'No data found',
  description = 'There is nothing to show here yet.',
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        {icon ?? <FolderOpen className="h-8 w-8" />}
      </div>
      <h3 className="typo-subtitle">{title}</h3>
      <p className="typo-secondary mt-2 max-w-md">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
