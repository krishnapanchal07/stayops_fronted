import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { getHomePath } from '@/routes/paths';
import { Navigate, Outlet } from 'react-router-dom';

export function GuestRoute() {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return <LoadingSpinner label="Checking session" />;
  }

  if (isAuthenticated && role) {
    return <Navigate to={getHomePath(role)} replace />;
  }

  return <Outlet />;
}
