import type { RoleCode } from '@/constants/roles';
import { useAppSelector } from '@/hooks/useAppSelector';
import { selectCurrentRole } from '@/store/selectors/authSelectors';

export function useHasRole(role: RoleCode | RoleCode[]): boolean {
  const currentRole = useAppSelector(selectCurrentRole);
  if (!currentRole) return false;
  return Array.isArray(role) ? role.includes(currentRole) : currentRole === role;
}
