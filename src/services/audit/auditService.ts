import { auditStore } from '@/services/audit/auditStore';
import {
  CRITICAL_AUDIT_ACTIONS,
  type AuditFilters,
  type AuditLog,
  type AuditSummary,
} from '@/types/audit';

function wait<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function inDateRange(timestamp: string, fromDate: string, toDate: string): boolean {
  const day = timestamp.slice(0, 10);
  if (fromDate && day < fromDate) return false;
  if (toDate && day > toDate) return false;
  return true;
}

export function filterAuditLogs(records: AuditLog[], filters: AuditFilters): AuditLog[] {
  const query = filters.query.trim().toLowerCase();
  return records.filter((log) => {
    if (query) {
      const haystack = [log.actorName, log.resourceLabel, log.description, log.resourceId, log.action]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.actorId && log.actorId !== filters.actorId) return false;
    if (filters.role && log.actorRole !== filters.role) return false;
    if (filters.action && log.action !== filters.action) return false;
    if (filters.resourceType && log.resourceType !== filters.resourceType) return false;
    if (filters.propertyId && log.propertyId !== filters.propertyId) return false;
    if (!inDateRange(log.timestamp, filters.fromDate, filters.toDate)) return false;
    return true;
  });
}

export function emptyAuditFilters(): AuditFilters {
  return {
    query: '',
    actorId: '',
    role: '',
    action: '',
    resourceType: '',
    propertyId: '',
    fromDate: '',
    toDate: '',
  };
}

function summarize(records: AuditLog[]): AuditSummary {
  const today = new Date().toISOString().slice(0, 10);
  return {
    today: records.filter((log) => log.timestamp.startsWith(today)).length,
    logins: records.filter((log) => log.action === 'LOGIN').length,
    updates: records.filter((log) => log.action === 'UPDATE' || log.action === 'STATUS_CHANGE').length,
    critical: records.filter((log) => CRITICAL_AUDIT_ACTIONS.includes(log.action)).length,
  };
}

export const auditService = {
  getAuditLogs(): Promise<AuditLog[]> {
    return wait(auditStore.list());
  },

  async getAuditLogById(id: string): Promise<AuditLog> {
    const record = auditStore.get(id);
    if (!record) return Promise.reject(new Error('Audit record not found.'));
    return wait(record);
  },

  async searchAuditLogs(filters: AuditFilters): Promise<AuditLog[]> {
    return wait(filterAuditLogs(auditStore.list(), filters));
  },

  getAuditSummary(): Promise<AuditSummary> {
    return wait(summarize(auditStore.list()));
  },
};
