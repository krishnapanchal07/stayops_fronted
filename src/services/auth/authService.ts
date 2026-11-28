import axios from 'axios';
import {
  applySession,
  clearSession,
  getSession,
  updateSession,
  type TokenResponse,
} from '@/services/auth/session';
import { authClient, httpClient, refreshSession, settleRefresh } from '@/services/http/client';
import type { AuthSession, User } from '@/types/user';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
export function authErrorMessage(error: unknown): string {
  if (error instanceof AuthError) return error.message;
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Unable to reach StayOps. Check your connection and try again.';
    return (
      error.response.data?.error?.message ?? 'Unable to complete the request. Please try again.'
    );
  }
  return 'Unable to complete the request. Please try again.';
}
export const authService = {
  async login(email: string, password: string, remember = true): Promise<AuthSession> {
    await settleRefresh();
    try {
      const { data } = await authClient.post<TokenResponse>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
        remember,
      });
      return applySession(data);
    } catch (error) {
      throw new AuthError(authErrorMessage(error));
    }
  },
  async logout(): Promise<void> {
    await settleRefresh();
    try {
      await authClient.post('/auth/logout');
      clearSession();
    } catch (error) {
      // Keep the UI session so the user can retry failed server revocation.
      throw new AuthError(authErrorMessage(error));
    }
  },
  async restoreSession(): Promise<AuthSession | null> {
    try {
      await refreshSession();
      const { data } = await httpClient.get<AuthSession>('/auth/me');
      return updateSession(data);
    } catch {
      clearSession();
      return null;
    }
  },
  async getCurrentUser(): Promise<User | null> {
    const { data } = await httpClient.get<AuthSession>('/auth/me');
    return updateSession(data).user;
  },
  isAuthenticated: () => getSession() !== null,
  getUserPermissions: () => getSession()?.permissions ?? [],
  async forgotPassword(email: string): Promise<string> {
    const { data } = await authClient.post<{ message: string }>('/auth/forgot-password', {
      email: email.trim().toLowerCase(),
    });
    return data.message;
  },
  async resetPassword(token: string, newPassword: string): Promise<string> {
    await settleRefresh();
    const { data } = await authClient.post<{ message: string }>('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    clearSession();
    return data.message;
  },
  async changePassword(
    _userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      await httpClient.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      clearSession();
    } catch (error) {
      throw new AuthError(authErrorMessage(error));
    }
  },
  async updateMyProfile(
    _userId: string,
    patch: { name: string; avatar?: string },
  ): Promise<AuthSession> {
    try {
      let avatar = patch.avatar;
      if (avatar?.startsWith('blob:')) {
        // Persist the existing photo input's preview using the profile endpoint.
        const blob = await (await fetch(avatar)).blob();
        avatar = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new AuthError('Unable to read the profile image.'));
          reader.readAsDataURL(blob);
        });
      }
      const { data } = await httpClient.patch<AuthSession>('/auth/me', { ...patch, avatar });
      return updateSession(data);
    } catch (error) {
      throw new AuthError(authErrorMessage(error));
    }
  },
};
