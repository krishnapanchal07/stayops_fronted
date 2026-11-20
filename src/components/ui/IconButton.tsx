import { cn } from '@/utils/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  variant?: 'soft' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

const variantClasses = {
  soft: 'bg-background text-text-secondary hover:bg-border hover:text-text',
  ghost: 'bg-transparent text-text-secondary hover:bg-background hover:text-text',
  danger: 'bg-danger-soft text-danger hover:bg-red-100',
};

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
};

export function IconButton({
  label,
  children,
  variant = 'soft',
  size = 'md',
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
