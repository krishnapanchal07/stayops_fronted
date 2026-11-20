import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { getHomePath, PATHS } from '@/routes/paths';
import { ShieldOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function ForbiddenPage() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const homePath = isAuthenticated && role ? getHomePath(role) : PATHS.login;

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <ShieldOff className="h-8 w-8" />
      </div>
      <p className="typo-muted">403</p>
      <h1 className="typo-page-title mt-2">Access denied</h1>
      <p className="typo-secondary mt-3">
        You do not have permission to access this page.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Link to={homePath}>
          <Button>Go to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
