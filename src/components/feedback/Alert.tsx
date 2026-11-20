import type { AlertVariant } from '@/types/ui';
import { cn } from '@/utils/cn';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

const styles: Record<AlertVariant, string> = {
  success: 'bg-success-soft text-green-800',
  warning: 'bg-warning-soft text-amber-800',
  danger: 'bg-danger-soft text-red-800',
  info: 'bg-info-soft text-blue-800',
};

const icons: Record<AlertVariant, ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0" />,
  danger: <XCircle className="h-4 w-4 shrink-0" />,
  info: <Info className="h-4 w-4 shrink-0" />,
};

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  return (
    <div
      className={cn('flex gap-3 rounded-xl px-4 py-3 text-sm', styles[variant], className)}
      role="status"
    >
      {icons[variant]}
      <div>
        {title ? <p className="mb-0.5 font-semibold">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
