import { cn } from '@/utils/cn';
import { Building2 } from 'lucide-react';

interface LogoProps {
  inverted?: boolean;
  compact?: boolean;
}

export function Logo({ inverted = false, compact = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl',
          inverted ? 'bg-white/10 text-white' : 'bg-primary text-white',
        )}
      >
        <Building2 className="h-5 w-5" />
      </span>
      {compact ? (
        <span className="sr-only">StayOps</span>
      ) : (
        <span className={cn('text-lg font-bold tracking-tight', inverted ? 'text-white' : 'text-text')}>
          StayOps
        </span>
      )}
    </div>
  );
}
