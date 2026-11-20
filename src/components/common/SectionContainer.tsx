import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

interface SectionContainerProps {
  children: ReactNode;
  className?: string;
}

export function SectionContainer({ children, className }: SectionContainerProps) {
  return <div className={cn('flex flex-col gap-5', className)}>{children}</div>;
}
