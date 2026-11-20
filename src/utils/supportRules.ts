import {
  SupportStatus,
  type SupportFilters,
  type SupportRequest,
  type SupportSummary,
} from '@/types/support';

const TRANSITIONS: Record<SupportStatus, SupportStatus[]> = {
  OPEN: [SupportStatus.IN_PROGRESS, SupportStatus.RESOLVED, SupportStatus.CLOSED],
  IN_PROGRESS: [SupportStatus.RESOLVED, SupportStatus.CLOSED],
  RESOLVED: [SupportStatus.CLOSED, SupportStatus.IN_PROGRESS],
  CLOSED: [],
};

export function canTransitionSupportStatus(from: SupportStatus, to: SupportStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function canCommentOnSupport(status: SupportStatus): boolean {
  return status === SupportStatus.OPEN || status === SupportStatus.IN_PROGRESS;
}

export function emptySupportFilters(): SupportFilters {
  return { query: '', category: '', status: '' };
}

export function filterSupportRequests(items: SupportRequest[], filters: SupportFilters): SupportRequest[] {
  const query = filters.query.trim().toLowerCase();
  return items.filter((item) => {
    if (filters.category && item.category !== filters.category) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (!query) return true;
    return (
      item.subject.toLowerCase().includes(query) ||
      item.supportCode.toLowerCase().includes(query) ||
      item.tenantName.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );
  });
}

export function summarizeSupport(items: SupportRequest[]): SupportSummary {
  return {
    total: items.length,
    open: items.filter((item) => item.status === SupportStatus.OPEN).length,
    inProgress: items.filter((item) => item.status === SupportStatus.IN_PROGRESS).length,
    resolved: items.filter((item) => item.status === SupportStatus.RESOLVED).length,
    closed: items.filter((item) => item.status === SupportStatus.CLOSED).length,
  };
}
