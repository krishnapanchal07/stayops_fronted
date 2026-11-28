import { Avatar } from '@/components/common/Avatar';
import { Dropdown } from '@/components/common/Dropdown';
import { RoleCode } from '@/constants/roles';
import type { User } from '@/types/user';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { PATHS } from '@/routes/paths';
import { setMobileNavOpen, toggleSidebarCollapsed } from '@/store/slices/uiSlice';
import { getProfilePath } from '@/utils/profilePath';
import { ChevronDown, LogOut, Menu, Settings, UserCircle } from 'lucide-react';
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
  const profilePath = getProfilePath(user.role);

  const settingsPath =
    user.role === RoleCode.SUPER_ADMIN || user.role === RoleCode.OWNER
      ? PATHS.admin.settings
      : profilePath;

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

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
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
