import { notificationStore } from '@/services/notification/notificationStore';
import { cn } from '@/utils/cn';
import { Bell, CreditCard, MessageSquareWarning, UserPlus } from 'lucide-react';
import { useSyncExternalStore } from 'react';

const toneClasses = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
};

const toneIcons = {
  success: CreditCard,
  warning: MessageSquareWarning,
  info: UserPlus,
};

interface NotificationPanelProps {
  open: boolean;
}

export function NotificationPanel({ open }: NotificationPanelProps) {
  const notifications = useSyncExternalStore(notificationStore.subscribe, notificationStore.list, notificationStore.list);
  const unread = notifications.filter((item) => item.unread).length;

  if (!open) {
    return null;
  }

  return (
    <div
      className="absolute top-14 right-0 z-30 w-[min(100vw-2rem,360px)] overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-overlay)]"
      role="dialog"
      aria-label="Notifications"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="typo-subtitle">Notifications</h2>
        </div>
        <span className="typo-muted">{unread} new</span>
      </div>
      <ul>
        {notifications.map((item) => {
          const Icon = toneIcons[item.tone];
          return (
            <li key={item.id} className="flex gap-3 border-b border-border px-4 py-3 last:border-b-0">
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', toneClasses[item.tone])}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text">{item.title}</p>
                <p className="typo-helper mt-0.5">{item.description}</p>
                <p className="typo-muted mt-1">{item.time}</p>
              </div>
              {item.unread ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-info" aria-label="Unread" /> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
