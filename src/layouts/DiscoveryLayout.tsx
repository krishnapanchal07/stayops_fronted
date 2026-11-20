import { Logo } from '@/components/common/Logo';
import { useAuth } from '@/hooks/useAuth';
import { PATHS, getHomePath } from '@/routes/paths';
import { Link, Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { useLayoutEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';

export function DiscoveryLayout() {
  const { isAuthenticated, role } = useAuth();
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const previousPath = useRef('');
  useLayoutEffect(() => {
    if (previousPath.current !== pathname && navigationType !== 'POP') window.scrollTo(0, 0);
    previousPath.current = pathname;
  }, [pathname, navigationType]);
  return (
    <div className="min-h-screen bg-background text-text">
      <a
        href="#discovery-content"
        className="sr-only z-50 rounded-lg bg-surface p-3 text-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to discovery
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex h-18 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-8">
          <div className="flex items-center gap-8">
            <Link to={PATHS.home} aria-label="StayOps home">
              <Logo />
            </Link>
            <Link
              to={PATHS.findRoom}
              className="hidden text-sm font-semibold text-primary sm:block"
            >
              Explore Rooms
            </Link>
          </div>
          <nav
            aria-label="Account navigation"
            className="flex items-center gap-4 text-sm font-medium"
          >
            {isAuthenticated && role ? (
              <Link
                to={getHomePath(role)}
                className="rounded-xl bg-primary px-4 py-2.5 text-white hover:bg-primary-dark"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link to={PATHS.login} className="hover:text-primary">
                  Login
                </Link>
                <Link
                  to={PATHS.register}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-white hover:bg-primary-dark"
                >
                  Sign Up <ArrowUpRight size={15} />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main
        id="discovery-content"
        className="mx-auto max-w-[1600px] scroll-mt-22 px-4 py-7 sm:px-8 sm:py-9"
        tabIndex={-1}
      >
        <Outlet />
      </main>
    </div>
  );
}
