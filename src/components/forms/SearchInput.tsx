import { cn } from '@/utils/cn';
import { Search } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  pill?: boolean;
}

export function SearchInput({ pill = false, className, ...props }: SearchInputProps) {
  return (
    <label className="relative block w-full">
      <span className="sr-only">{props['aria-label'] ?? 'Search'}</span>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        className={cn(
          'h-11 w-full border border-border bg-input pr-3 pl-10 text-sm text-text placeholder:text-muted',
          pill ? 'rounded-full' : 'rounded-xl',
          className,
        )}
        {...props}
      />
    </label>
  );
}
