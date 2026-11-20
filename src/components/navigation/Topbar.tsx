import { Avatar } from '@/components/common/Avatar';
import { Dropdown } from '@/components/common/Dropdown';
import { SearchInput } from '@/components/forms/SearchInput';
import { NotificationPanel } from '@/components/navigation/NotificationPanel';
import { RoleCode } from '@/constants/roles';
import type { User } from '@/types/user';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { PATHS } from '@/routes/paths';
import { notificationStore } from '@/services/notification/notificationStore';
import { setMobileNavOpen, toggleSidebarCollapsed } from '@/store/slices/uiSlice';
import { getProfilePath } from '@/utils/profilePath';
import { Bell, ChevronDown, LogOut, Menu, Settings, UserCircle } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  user: User;
  onLogout: () => void;
}

export function Topbar({ user, onLogout }: TopbarProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isMobileNavOpen = useAppSelector((state) => state.ui.isMobileNavOpen);
  const isSidebarCollapsed = useAppSelector((state) => state.ui.isSidebarCollapsed);
  const unreadCount = useSyncExternalStore(
    notificationStore.subscribe,
    notificationStore.unreadCount,
    notificationStore.unreadCount,
  );
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const notificationRef = useRef<HTMLDivElement>(null);

  const profilePath = getProfilePath(user.role);

  const settingsPath =
    user.role === RoleCode.SUPER_ADMIN || user.role === RoleCode.OWNER
      ? PATHS.admin.settings
      : profilePath;

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  return (
    <header className="flex h-[72px] items-center gap-4 border-b border-border bg-surface px-4 sm:px-6">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary hover:bg-background lg:hidden"
        aria-label={isMobileNavOpen ? 'Close navigation' : 'Open navigation'}
        onClick={() => dispatch(setMobileNavOpen(!isMobileNavOpen))}
      >
        <Menu className="h-5 w-5" />
      </button>
      <button
        type="button"
        className="hidden h-10 w-10 items-center justify-center rounded-xl text-text-secondary hover:bg-background lg:inline-flex"
        aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-controls="desktop-sidebar"
        aria-expanded={!isSidebarCollapsed}
        onClick={() => dispatch(toggleSidebarCollapsed())}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="mx-auto hidden w-full max-w-xl md:block">
        <SearchInput
          placeholder="Search anything..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search anything"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div ref={notificationRef} className="relative">
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary hover:bg-background"
            aria-label="Open notifications"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((current) => !current)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>
          <NotificationPanel open={notificationsOpen} />
        </div>

        <Dropdown
          items={[
            {
              id: 'profile',
              label: 'Profile',
              icon: <UserCircle className="h-4 w-4" />,
              onSelect: () => navigate(profilePath),
            },
            {
              id: 'settings',
              label: 'Settings',
              icon: <Settings className="h-4 w-4" />,
              onSelect: () => navigate(settingsPath),
            },
            {
              id: 'logout',
              label: 'Logout',
              icon: <LogOut className="h-4 w-4" />,
              danger: true,
              onSelect: onLogout,
            },
          ]}
          trigger={
            <div className="flex cursor-pointer items-center gap-3 rounded-xl px-1.5 py-1 hover:bg-background">
              <Avatar name={user.name} initials={user.initials} />
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-text">{user.name}</p>
                <p className="typo-muted">{user.roleLabel}</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted sm:block" />
            </div>
          }
        />
      </div>
    </header>
  );
}
