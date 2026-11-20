import type { BreadcrumbItem } from '@/types/ui';

const LABEL_OVERRIDES: Record<string, string> = {
  admin: 'Home',
  tenant: 'Home',
  accountant: 'Home',
  security: 'Home',
  maintenance: 'Home',
  warden: 'Home',
  'leave-requests': 'Leave Requests',
  leave: 'Leave & Gate Pass',
  visitors: 'Visitors',
  'my-room': 'My Room',
  'find-room': 'Find Room',
  inquiries: 'Inquiries',
  receipts: 'Receipts',
  invoices: 'Invoices',
  'outstanding-dues': 'Outstanding Dues',
  'visitor-check-in': 'Visitor Check-in',
  'visitor-check-out': 'Visitor Check-out',
  'gate-passes': 'Gate Passes',
  'entry-exit-logs': 'Entry / Exit Logs',
  'assigned-complaints': 'Assigned Complaints',
  'task-details': 'Task Details',
  tasks: 'Tasks',
  'audit-logs': 'Audit Logs',
  notices: 'Notices',
  documents: 'Documents',
  profile: 'My Profile',
  help: 'Help & Support',
  requests: 'Support Requests',
  support: 'Support',
};

function toLabel(segment: string): string {
  if (LABEL_OVERRIDES[segment]) {
    return LABEL_OVERRIDES[segment];
  }

  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function breadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [{ label: 'Home' }];
  }

  return segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    const isLast = index === segments.length - 1;
    return {
      label: toLabel(segment),
      href: isLast ? undefined : href,
    };
  });
}
