import { cn } from '@/utils/cn';

interface AvatarProps {
  src?: string;
  name: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
}

export function Avatar({ src, name, initials, size = 'md' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={`${name} avatar`}
        className={cn('rounded-full object-cover', sizeClasses[size])}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-primary-soft font-semibold text-primary',
        sizeClasses[size],
      )}
    >
      {initials ?? getInitials(name)}
    </span>
  );
}
