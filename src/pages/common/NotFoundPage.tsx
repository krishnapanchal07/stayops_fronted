import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { getHomePath, PATHS } from '@/routes/paths';
import { SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  const { isAuthenticated, role } = useAuth();
  const homePath = isAuthenticated && role ? getHomePath(role) : PATHS.login;

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <SearchX className="h-8 w-8" />
      </div>
      <p className="typo-muted">404</p>
      <h1 className="typo-page-title mt-2">Page not found</h1>
      <p className="typo-secondary mt-3">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to={homePath}>
          <Button>{isAuthenticated ? 'Go to dashboard' : 'Go to login'}</Button>
        </Link>
      </div>
    </div>
  );
}
