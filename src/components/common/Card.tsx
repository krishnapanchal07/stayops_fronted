import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]',
        padding && 'p-5',
        className,
      )}
    >
      {children}
    </section>
  );
}

interface CardHeaderProps {
  title: string;
  action?: ReactNode;
}

export function CardHeader({ title, action }: CardHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="typo-subtitle">{title}</h2>
      {action}
    </div>
  );
}
