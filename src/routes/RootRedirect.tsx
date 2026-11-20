import { useAuth } from '@/hooks/useAuth';
import { getHomePath } from '@/routes/paths';
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { Navigate } from 'react-router-dom';

const LandingPage = lazy(() => import('@/pages/public/LandingPage'));

export function RootRedirect() {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated && role) {
    return <Navigate to={getHomePath(role)} replace />;
  }

  return (
    <Suspense fallback={<LoadingSpinner label="Loading StayOps" />}>
      <LandingPage />
    </Suspense>
  );
}
