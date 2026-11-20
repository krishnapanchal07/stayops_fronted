import type { Permission } from '@/constants/permissions';
import type { RoleCode } from '@/constants/roles';
import type { AuthSession, User } from '@/types/user';

export type AuthStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  role: RoleCode | null;
  permissions: Permission[];
  status: AuthStatus;
  error: string | null;
}

export type { AuthSession, User };
