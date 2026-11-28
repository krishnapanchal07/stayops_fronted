import { authService } from '@/services/auth/authService';
import type { AuthSession } from '@/types/user';

export const profileService = {


  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    return authService.changePassword(userId, currentPassword, newPassword);
  },

  updateMyProfile(userId: string, patch: { name: string; avatar?: string }): Promise<AuthSession> {
    return authService.updateMyProfile(userId, patch);
  },
};
