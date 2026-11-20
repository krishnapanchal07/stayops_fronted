import seedLogs from '@/mock/auditLogs.json';
import type { AuditLog } from '@/types/audit';

let logs = structuredClone(seedLogs) as AuditLog[];

function clone<T>(value: T): T {
  return structuredClone(value);
}

export const auditStore = {
  list(): AuditLog[] {
    return clone(logs).sort((left, right) => right.timestamp.localeCompare(left.timestamp));
  },

  get(id: string): AuditLog | undefined {
    const record = logs.find((item) => item.id === id);
    return record ? clone(record) : undefined;
  },

  append(record: AuditLog): AuditLog {
    logs = [record, ...logs];
    return clone(record);
  },
};
