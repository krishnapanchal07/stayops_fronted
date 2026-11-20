import type { NavItem } from '@/types/navigation';
import { cn } from '@/utils/cn';
import { NavLink } from 'react-router-dom';

interface SidebarItemProps {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarItem({ item, collapsed, onNavigate }: SidebarItemProps) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'flex h-10 items-center overflow-hidden rounded-xl py-2.5 text-sm font-medium transition-colors',
          collapsed ? 'justify-center gap-0 px-0' : 'gap-3 px-[19px]',
          isActive
            ? 'bg-primary text-white'
            : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-white',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span
        className={cn(
          'whitespace-nowrap transition-opacity duration-200 motion-reduce:transition-none',
          collapsed ? 'sr-only opacity-0' : 'opacity-100',
        )}
      >
        {item.label}
      </span>
    </NavLink>
  );
}
