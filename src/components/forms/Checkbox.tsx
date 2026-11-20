import { cn } from '@/utils/cn';
import type { InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const checkboxId = id ?? props.name ?? label;

  return (
    <label htmlFor={checkboxId} className="inline-flex items-center gap-2 text-sm text-text">
      <input
        id={checkboxId}
        type="checkbox"
        className={cn(
          'h-4 w-4 rounded border-border text-primary accent-primary focus-visible:outline-offset-2',
          className,
        )}
        {...props}
      />
      {label}
    </label>
  );
}
