import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  helperText,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <label htmlFor={htmlFor} className="typo-label">
          {label}
          {required ? (
            <span className="text-danger" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="typo-error" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="typo-helper">{helperText}</p>
      ) : null}
    </div>
  );
}
