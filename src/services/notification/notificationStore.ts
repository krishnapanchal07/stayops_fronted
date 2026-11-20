export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  tone: 'success' | 'warning' | 'info';
}

const seed: AppNotification[] = [
  {
    id: 'note-1',
    title: 'New Rent Payment',
    description: 'Rahul Sharma paid ₹8,000 for Room 205.',
    time: '2 min ago',
    unread: true,
    tone: 'success',
  },
  {
    id: 'note-2',
    title: 'Complaint Assigned',
    description: 'Plumbing issue reported in Sunrise PG.',
    time: '18 min ago',
    unread: true,
    tone: 'warning',
  },
  {
    id: 'note-3',
    title: 'Visitor Request',
    description: 'A visitor is waiting at the main gate.',
    time: '1 hr ago',
    unread: false,
    tone: 'info',
  },
];

let notifications = seed;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export const notificationStore = {
  list(): AppNotification[] {
    return notifications;
  },
  unreadCount(): number {
    return notifications.filter((item) => item.unread).length;
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  push(notification: Omit<AppNotification, 'id' | 'time' | 'unread'> & { id?: string }): AppNotification {
    const next: AppNotification = {
      id: notification.id ?? `note-${Date.now().toString(36)}`,
      title: notification.title,
      description: notification.description,
      tone: notification.tone,
      time: 'Just now',
      unread: true,
    };
    notifications = [next, ...notifications].slice(0, 20);
    emit();
    return next;
  },
};
