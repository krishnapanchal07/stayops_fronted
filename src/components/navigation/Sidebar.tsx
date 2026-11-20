import { Logo } from '@/components/common/Logo';
import { SidebarItem } from '@/components/navigation/SidebarItem';
import { getNavigationForRole } from '@/constants/navigation';
import type { Permission } from '@/constants/permissions';
import type { RoleCode } from '@/constants/roles';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { setSidebarCollapsed } from '@/store/slices/uiSlice';
import { cn } from '@/utils/cn';

interface SidebarProps {
  role: RoleCode;
  permissions?: Permission[];
  onNavigate?: () => void;
  mobile?: boolean;
}

export function Sidebar({ role, permissions, onNavigate, mobile = false }: SidebarProps) {
  const dispatch = useAppDispatch();
  const isSidebarCollapsed = useAppSelector((state) => state.ui.isSidebarCollapsed);
  const collapsed = !mobile && isSidebarCollapsed;
  const groups = getNavigationForRole(role, permissions);

  return (
    <aside
      id={mobile ? 'mobile-sidebar' : 'desktop-sidebar'}
      onPointerEnter={(event) => {
        if (!mobile && event.pointerType !== 'touch') dispatch(setSidebarCollapsed(false));
      }}
      onPointerLeave={(event) => {
        if (!mobile && event.pointerType !== 'touch') dispatch(setSidebarCollapsed(true));
      }}
      onFocusCapture={() => {
        if (!mobile) dispatch(setSidebarCollapsed(false));
      }}
      onBlurCapture={(event) => {
        if (!mobile && !event.currentTarget.contains(event.relatedTarget)) {
          dispatch(setSidebarCollapsed(true));
        }
      }}
      onKeyDown={(event) => {
        if (!mobile && event.key === 'Escape') {
          dispatch(setSidebarCollapsed(true));
        }
      }}
      className={cn(
        'sidebar-glass flex h-full flex-col overflow-hidden rounded-[20px] border text-white transition-[width,box-shadow] duration-300 ease-in-out motion-reduce:transition-none',
        collapsed ? 'w-20' : 'w-[260px]',
        !collapsed && !mobile && 'shadow-overlay',
      )}
    >
      <div className="flex h-[72px] w-[260px] shrink-0 items-center gap-2.5 px-[22px]">
        <Logo inverted compact />
        <span
          aria-hidden="true"
          className={cn(
            'text-lg font-bold tracking-tight transition-opacity duration-200 motion-reduce:transition-none',
            collapsed ? 'opacity-0' : 'opacity-100',
          )}
        >
          StayOps
        </span>
      </div>

      <nav
        className="sidebar-scroll flex-1 overflow-x-hidden overflow-y-auto px-3 py-2"
        aria-label="Primary"
      >
        {groups.map((group) => (
          <div key={group.id} className="mb-5 last:mb-2">
            <div className="relative mb-2 h-4">
              <p
                className={cn(
                  'px-3 text-[11px] font-semibold tracking-[0.14em] whitespace-nowrap text-sidebar-muted uppercase transition-opacity duration-200 motion-reduce:transition-none',
                  collapsed ? 'opacity-0' : 'opacity-100',
                )}
              >
                {group.label}
              </p>
              <div
                aria-hidden="true"
                className={cn(
                  'absolute top-2 left-3 h-px w-8 bg-sidebar-border transition-opacity duration-200 motion-reduce:transition-none',
                  collapsed ? 'opacity-100' : 'opacity-0',
                )}
              />
            </div>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
