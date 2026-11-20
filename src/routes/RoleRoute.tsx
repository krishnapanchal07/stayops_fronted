import type { RoleCode } from '@/constants/roles';
import { useHasRole } from '@/hooks/useHasRole';
import { PATHS } from '@/routes/paths';
import { Navigate, Outlet } from 'react-router-dom';

interface RoleRouteProps {
  allowed: RoleCode[];
}

export function RoleRoute({ allowed }: RoleRouteProps) {
  const allowedRole = useHasRole(allowed);

  if (!allowedRole) {
    return <Navigate to={PATHS.forbidden} replace />;
  }

  return <Outlet />;
}
