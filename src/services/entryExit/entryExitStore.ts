import seedLogs from '@/mock/entryExitLogs.json';
import type { EntryExitLog } from '@/types/entryExit';

function clone<T>(value: T): T {
  return structuredClone(value);
}

let logs: EntryExitLog[] = clone(seedLogs as EntryExitLog[]);

export const entryExitStore = {
  list(): EntryExitLog[] {
    return clone(logs);
  },
  insert(record: EntryExitLog): EntryExitLog {
    logs = [record, ...logs];
    return clone(record);
  },
  persist(record: EntryExitLog): EntryExitLog {
    logs = logs.map((item) => (item.id === record.id ? record : item));
    return clone(record);
  },
  byVisitor(visitorId: string): EntryExitLog | undefined {
    const item = logs.find((log) => log.visitorId === visitorId && log.status !== 'COMPLETED');
    return item ? clone(item) : undefined;
  },
  byLeave(leaveId: string): EntryExitLog | undefined {
    const item = logs.find((log) => log.leaveId === leaveId && log.status !== 'COMPLETED');
    return item ? clone(item) : undefined;
  },
};
