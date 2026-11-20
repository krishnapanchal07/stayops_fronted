import type { BadgeVariant } from '@/types/ui';
import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

const styles: Record<BadgeVariant, string> = {
  success: 'bg-success-soft text-green-700',
  warning: 'bg-warning-soft text-amber-700',
  danger: 'bg-danger-soft text-red-700',
  info: 'bg-info-soft text-blue-700',
  muted: 'bg-background text-muted',
  primary: 'bg-primary-soft text-primary',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'muted', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'typo-badge inline-flex items-center rounded-full px-2.5 py-1',
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
