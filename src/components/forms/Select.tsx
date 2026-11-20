import { fieldBorderClass, fieldControlClass } from '@/components/forms/fieldStyles';
import { FormField } from '@/components/forms/FormField';
import type { SelectOption } from '@/types/ui';
import { cn } from '@/utils/cn';
import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  helperText,
  options,
  placeholder,
  id,
  required,
  className,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <FormField
      label={label}
      htmlFor={selectId}
      error={error}
      helperText={helperText}
      required={required}
    >
      <div className="relative">
        <select
          id={selectId}
          required={required}
          className={cn(
            fieldControlClass,
            fieldBorderClass(error),
            'appearance-none pr-10',
            className,
          )}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
    </FormField>
  );
}
