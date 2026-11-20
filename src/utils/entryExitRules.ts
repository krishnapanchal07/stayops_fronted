import { type EntryExitFilters, type EntryExitLog } from '@/types/entryExit';

export function emptyEntryExitFilters(): EntryExitFilters {
  return { query: '', propertyId: '', tenantId: '', status: '', kind: '', fromDate: '', toDate: '' };
}

export function filterEntryExitLogs(logs: EntryExitLog[], filters: EntryExitFilters): EntryExitLog[] {
  const query = filters.query.trim().toLowerCase();
  return logs.filter((log) => {
    if (filters.propertyId && log.propertyId !== filters.propertyId) return false;
    if (filters.tenantId && log.tenantId !== filters.tenantId) return false;
    if (filters.status && log.status !== filters.status) return false;
    if (filters.kind && log.kind !== filters.kind) return false;
    const stamp = (log.entryAt ?? log.exitAt ?? log.createdAt).slice(0, 10);
    if (filters.fromDate && stamp < filters.fromDate) return false;
    if (filters.toDate && stamp > filters.toDate) return false;
    if (!query) return true;
    return (
      log.passCode.toLowerCase().includes(query) ||
      log.personName.toLowerCase().includes(query) ||
      log.tenantName.toLowerCase().includes(query) ||
      log.roomNumber.toLowerCase().includes(query)
    );
  });
}
