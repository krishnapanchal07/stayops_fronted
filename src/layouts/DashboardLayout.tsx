import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Topbar } from '@/components/navigation/Topbar';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { setMobileNavOpen } from '@/store/slices/uiSlice';
import { cn } from '@/utils/cn';
import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { user, role, permissions, logout } = useAuth();
  const isMobileNavOpen = useAppSelector((state) => state.ui.isMobileNavOpen);

  useEffect(() => {
    dispatch(setMobileNavOpen(false));
  }, [dispatch, location.pathname]);

  const handleLogout = async () => {
    await logout();
    dispatch(setMobileNavOpen(false));
    toast('success', 'You have been logged out');
    navigate(PATHS.login, { replace: true });
  };

  if (!user || !role) {
    return <LoadingSpinner label="Loading workspace" />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-24 shrink-0 lg:block">
        <div className="fixed top-2 bottom-2 left-2 z-30">
          <Sidebar role={role} permissions={permissions} />
        </div>
      </div>

      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          isMobileNavOpen ? 'visible' : 'invisible pointer-events-none',
        )}
      >
        <button
          type="button"
          aria-label="Close navigation overlay"
          className={cn(
            'absolute inset-0 bg-sidebar/50 transition-opacity',
            isMobileNavOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => dispatch(setMobileNavOpen(false))}
        />
        <div
          className={cn(
            'absolute top-2 bottom-2 left-2 transition-transform duration-200 motion-reduce:transition-none',
            isMobileNavOpen ? 'translate-x-0' : '-translate-x-[calc(100%+16px)]',
          )}
        >
          <Sidebar
            mobile
            role={role}
            permissions={permissions}
            onNavigate={() => dispatch(setMobileNavOpen(false))}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onLogout={handleLogout} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
