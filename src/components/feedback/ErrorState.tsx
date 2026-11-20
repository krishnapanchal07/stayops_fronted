import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this section. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h3 className="typo-subtitle">{title}</h3>
      <p className="typo-secondary mt-2 max-w-md">{description}</p>
      {onRetry ? (
        <Button variant="danger" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
