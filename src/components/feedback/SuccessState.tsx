import { Button } from '@/components/ui/Button';
import { CheckCircle2 } from 'lucide-react';

interface SuccessStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SuccessState({
  title = 'Action completed',
  description = 'The request finished successfully.',
  actionLabel,
  onAction,
}: SuccessStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success-soft text-success">
        <CheckCircle2 className="h-8 w-8" />
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
