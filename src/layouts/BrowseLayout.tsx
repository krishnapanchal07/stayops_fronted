import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getHomePath, PATHS } from '@/routes/paths';
import { Link, Outlet, useNavigate } from 'react-router-dom';

export function BrowseLayout() {
  const { isAuthenticated } = useAuth();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const dashboardPath = user ? getHomePath(user.role) : PATHS.login;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-6">
            <Link to={PATHS.findRoom} aria-label="StayOps home">
              <Logo />
            </Link>
            <Link to={PATHS.findRoom} className="hidden text-sm font-medium text-primary sm:inline">
              Find Room
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button size="sm" onClick={() => navigate(dashboardPath)}>
                Go to dashboard
              </Button>
            ) : (
              <>
                <Link to={PATHS.login} className="text-sm font-medium text-text-secondary hover:text-text">
                  Login
                </Link>
                <Button size="sm" onClick={() => navigate(PATHS.register)}>
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
