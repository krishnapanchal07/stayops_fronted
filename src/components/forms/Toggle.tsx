import { cn } from '@/utils/cn';
import type { ButtonHTMLAttributes } from 'react';

interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onCheckedChange, label, className, ...props }: ToggleProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-border',
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </button>
      {label ? <span className="text-sm text-text">{label}</span> : null}
    </div>
  );
}
