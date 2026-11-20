import type { Permission } from '@/constants/permissions';
import { useAppSelector } from '@/hooks/useAppSelector';
import { selectPermissions } from '@/store/selectors/authSelectors';

export function useHasPermission(permission: Permission): boolean {
  const permissions = useAppSelector(selectPermissions);
  return permissions.includes(permission);
}
