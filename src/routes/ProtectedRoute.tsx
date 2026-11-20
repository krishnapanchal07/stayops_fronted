import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner label="Checking session" />;
  }

  if (!isAuthenticated) {
    return <Navigate to={PATHS.login} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
