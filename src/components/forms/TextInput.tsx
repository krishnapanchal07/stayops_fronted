import { fieldBorderClass, fieldControlClass } from '@/components/forms/fieldStyles';
import { FormField } from '@/components/forms/FormField';
import { cn } from '@/utils/cn';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function TextInput({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  id,
  required,
  className,
  ...props
}: TextInputProps) {
  const inputId = id ?? props.name;

  return (
    <FormField
      label={label}
      htmlFor={inputId}
      error={error}
      helperText={helperText}
      required={required}
    >
      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
            {leftIcon}
          </span>
        ) : null}
        <input
          id={inputId}
          required={required}
          className={cn(
            fieldControlClass,
            fieldBorderClass(error),
            leftIcon ? 'pl-10' : undefined,
            rightIcon ? 'pr-10' : undefined,
            className,
          )}
          {...props}
        />
        {rightIcon ? (
          <span className="absolute inset-y-0 right-3 flex items-center text-muted">{rightIcon}</span>
        ) : null}
      </div>
    </FormField>
  );
}
