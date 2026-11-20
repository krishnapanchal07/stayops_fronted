import { authService } from '@/services/auth/authService';
import { profileSettingsStore } from '@/services/profile/profileSettingsStore';
import type { NotificationPreferences } from '@/types/support';
import type { AuthSession } from '@/types/user';

function wait<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

export const profileService = {
  getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    return wait(profileSettingsStore.get(userId));
  },

  saveNotificationPreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
    return wait(profileSettingsStore.save(preferences));
  },

  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    return authService.changePassword(userId, currentPassword, newPassword);
  },

  updateMyProfile(userId: string, patch: { name: string; avatar?: string }): Promise<AuthSession> {
    return authService.updateMyProfile(userId, patch);
  },
};
