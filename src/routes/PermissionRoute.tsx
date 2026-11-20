import type { Permission } from '@/constants/permissions';
import { useHasPermission } from '@/hooks/useHasPermission';
import { PATHS } from '@/routes/paths';
import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface PermissionRouteProps {
  permission: Permission;
  children?: ReactNode;
}

export function PermissionRoute({ permission, children }: PermissionRouteProps) {
  const allowed = useHasPermission(permission);

  if (!allowed) {
    return <Navigate to={PATHS.forbidden} replace />;
  }

  return children ? children : <Outlet />;
}
