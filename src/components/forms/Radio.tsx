import { cn } from '@/utils/cn';
import type { InputHTMLAttributes } from 'react';

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function Radio({ label, className, id, ...props }: RadioProps) {
  const radioId = id ?? `${props.name}-${props.value}`;

  return (
    <label htmlFor={radioId} className="inline-flex items-center gap-2 text-sm text-text">
      <input
        id={radioId}
        type="radio"
        className={cn('h-4 w-4 border-border text-primary accent-primary', className)}
        {...props}
      />
      {label}
    </label>
  );
}
