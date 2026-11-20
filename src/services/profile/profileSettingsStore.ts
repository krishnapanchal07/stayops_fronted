import type { NotificationPreferences } from '@/types/support';

function clone<T>(value: T): T {
  return structuredClone(value);
}

function defaults(userId: string): NotificationPreferences {
  return {
    userId,
    payments: true,
    complaints: true,
    visitors: true,
    leave: true,
    notices: true,
  };
}

const settings = new Map<string, NotificationPreferences>();

export const profileSettingsStore = {
  get(userId: string): NotificationPreferences {
    return clone(settings.get(userId) ?? defaults(userId));
  },
  save(next: NotificationPreferences): NotificationPreferences {
    settings.set(next.userId, clone(next));
    return clone(next);
  },
};
