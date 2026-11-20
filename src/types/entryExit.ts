export const EntryExitKind = {
  VISITOR: 'VISITOR',
  LEAVE: 'LEAVE',
} as const;

export type EntryExitKind = (typeof EntryExitKind)[keyof typeof EntryExitKind];

export const EntryExitStatus = {
  INSIDE: 'INSIDE',
  OUT: 'OUT',
  COMPLETED: 'COMPLETED',
} as const;

export type EntryExitStatus = (typeof EntryExitStatus)[keyof typeof EntryExitStatus];

export const ENTRY_EXIT_STATUS_LABELS: Record<EntryExitStatus, string> = {
  INSIDE: 'Inside',
  OUT: 'Out',
  COMPLETED: 'Completed',
};

export interface EntryExitLog {
  id: string;
  kind: EntryExitKind;
  passCode: string;
  visitorId: string | null;
  leaveId: string | null;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  roomNumber: string;
  personName: string;
  entryAt: string | null;
  exitAt: string | null;
  returnAt: string | null;
  status: EntryExitStatus;
  recordedBy: string;
  recordedByName: string;
  createdAt: string;
}

export interface EntryExitFilters {
  query: string;
  propertyId: string;
  tenantId: string;
  status: EntryExitStatus | '';
  kind: EntryExitKind | '';
  fromDate: string;
  toDate: string;
}
