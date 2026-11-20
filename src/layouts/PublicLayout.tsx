import { Logo } from '@/components/common/Logo';
import { PATHS } from '@/routes/paths';
import { Link, Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-5">
          <Link to={PATHS.login} aria-label="StayOps home">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-5xl items-center justify-center px-5 py-12">
        <Outlet />
      </main>
    </div>
  );
}
