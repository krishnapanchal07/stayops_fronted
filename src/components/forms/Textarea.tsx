import { fieldBorderClass } from '@/components/forms/fieldStyles';
import { FormField } from '@/components/forms/FormField';
import { cn } from '@/utils/cn';
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({
  label,
  error,
  helperText,
  id,
  required,
  className,
  rows = 4,
  ...props
}: TextareaProps) {
  const textareaId = id ?? props.name;

  return (
    <FormField
      label={label}
      htmlFor={textareaId}
      error={error}
      helperText={helperText}
      required={required}
    >
      <textarea
        id={textareaId}
        required={required}
        rows={rows}
        className={cn(
          'w-full rounded-xl border bg-input px-3 py-2.5 text-sm text-text placeholder:text-muted',
          fieldBorderClass(error),
          className,
        )}
        {...props}
      />
    </FormField>
  );
}
