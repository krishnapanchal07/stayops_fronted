import { cn } from '@/utils/cn';
import type { ButtonSize, ButtonVariant } from '@/types/ui';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm',
  secondary: 'bg-white text-primary border border-primary hover:bg-primary-soft',
  outline: 'bg-white text-text border border-border hover:bg-background',
  ghost: 'bg-transparent text-primary hover:bg-primary-soft',
  danger: 'bg-danger text-white hover:bg-red-600 shadow-sm',
  success: 'bg-success text-white hover:bg-green-600 shadow-sm',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
