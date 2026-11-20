import type { Permission } from '@/constants/permissions';
import type { RoleCode } from '@/constants/roles';
import type { RootState } from '@/store';

export const selectAuth = (state: RootState) => state.auth;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectCurrentRole = (state: RootState) => state.auth.role;
export const selectPermissions = (state: RootState) => state.auth.permissions;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAuthLoading = (state: RootState) => state.auth.status === 'loading';

export const selectHasRole = (role: RoleCode) => (state: RootState) => state.auth.role === role;

export const selectHasPermission = (permission: Permission) => (state: RootState) =>
  state.auth.permissions.includes(permission);
