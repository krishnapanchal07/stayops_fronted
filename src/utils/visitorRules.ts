import { VisitorStatus, type Visitor, type VisitorFilters, type VisitorSummary } from '@/types/visitor';

const TRANSITIONS: Record<VisitorStatus, VisitorStatus[]> = {
  PENDING: [VisitorStatus.APPROVED, VisitorStatus.REJECTED, VisitorStatus.CANCELLED],
  APPROVED: [VisitorStatus.CHECKED_IN, VisitorStatus.EXPIRED, VisitorStatus.CANCELLED],
  CHECKED_IN: [VisitorStatus.CHECKED_OUT],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
  CHECKED_OUT: [],
};

export function canTransitionVisitorStatus(from: VisitorStatus, to: VisitorStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function localToday(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function combineDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

export function visitorWindowEnd(visitor: Pick<Visitor, 'visitDate' | 'expectedExitTime' | 'qrExpiresAt'>): Date {
  if (visitor.qrExpiresAt) return new Date(visitor.qrExpiresAt);
  return combineDateTime(visitor.visitDate, visitor.expectedExitTime);
}

export function isVisitorPassExpired(visitor: Visitor, now = new Date()): boolean {
  return now.getTime() > visitorWindowEnd(visitor).getTime();
}

export function canVerifyVisitorPass(visitor: Visitor, now = new Date()): string | null {
  if (visitor.status === VisitorStatus.PENDING) {
    return 'This visitor request is still pending approval. A warden or admin must approve it before check-in.';
  }
  if (visitor.status === VisitorStatus.CHECKED_IN) return 'Visitor is already checked in.';
  if (visitor.status === VisitorStatus.CHECKED_OUT) return 'Visitor has already checked out.';
  if (visitor.status === VisitorStatus.REJECTED) return 'This visitor request was rejected.';
  if (visitor.status === VisitorStatus.CANCELLED) return 'This visitor request was cancelled.';
  if (visitor.status === VisitorStatus.EXPIRED || isVisitorPassExpired(visitor, now)) {
    return 'Invalid or expired visitor pass.';
  }
  if (visitor.status !== VisitorStatus.APPROVED) return 'Invalid or expired visitor pass.';
  if (!visitor.qrToken) return 'No visitor pass has been generated yet.';
  return null;
}

export function isVisitorOverstay(visitor: Visitor, now = new Date()): boolean {
  return visitor.status === VisitorStatus.CHECKED_IN && now.getTime() > visitorWindowEnd(visitor).getTime();
}

function isOpenVisitor(visitor: Visitor): boolean {
  return (
    visitor.status !== VisitorStatus.REJECTED &&
    visitor.status !== VisitorStatus.CANCELLED &&
    visitor.status !== VisitorStatus.EXPIRED &&
    visitor.status !== VisitorStatus.CHECKED_OUT
  );
}

function windowsOverlap(visitDate: string, entry: string, exit: string, visitor: Visitor): boolean {
  const start = combineDateTime(visitDate, entry).getTime();
  const end = combineDateTime(visitDate, exit).getTime();
  const otherStart = combineDateTime(visitor.visitDate, visitor.expectedEntryTime).getTime();
  const otherEnd = combineDateTime(visitor.visitDate, visitor.expectedExitTime).getTime();
  return start < otherEnd && end > otherStart;
}

export function isIdenticalVisitorRequest(
  current: Visitor[],
  tenantId: string,
  visitorName: string,
  visitDate: string,
  entry: string,
  exit: string,
  ignoreId?: string,
): boolean {
  const name = visitorName.trim().toLowerCase();
  return current.some(
    (visitor) =>
      visitor.tenantId === tenantId &&
      visitor.id !== ignoreId &&
      isOpenVisitor(visitor) &&
      visitor.visitorName.trim().toLowerCase() === name &&
      visitor.visitDate === visitDate &&
      windowsOverlap(visitDate, entry, exit, visitor),
  );
}

export function isVisitorOverlapping(
  current: Visitor[],
  tenantId: string,
  visitDate: string,
  entry: string,
  exit: string,
  ignoreId?: string,
): boolean {
  return current.some((visitor) => {
    if (visitor.tenantId !== tenantId || visitor.id === ignoreId || !isOpenVisitor(visitor)) return false;
    return windowsOverlap(visitDate, entry, exit, visitor);
  });
}

export function emptyVisitorFilters(): VisitorFilters {
  return {
    query: '',
    propertyId: '',
    buildingId: '',
    roomId: '',
    status: '',
    tenantId: '',
    fromDate: '',
    toDate: '',
  };
}

export function filterVisitors(visitors: Visitor[], filters: VisitorFilters): Visitor[] {
  const query = filters.query.trim().toLowerCase();
  return visitors.filter((visitor) => {
    if (filters.propertyId && visitor.propertyId !== filters.propertyId) return false;
    if (filters.roomId && visitor.roomId !== filters.roomId) return false;
    if (filters.status && visitor.status !== filters.status) return false;
    if (filters.tenantId && visitor.tenantId !== filters.tenantId) return false;
    if (filters.fromDate && visitor.visitDate < filters.fromDate) return false;
    if (filters.toDate && visitor.visitDate > filters.toDate) return false;
    if (!query) return true;
    return (
      visitor.visitorCode.toLowerCase().includes(query) ||
      visitor.visitorName.toLowerCase().includes(query) ||
      visitor.tenantName.toLowerCase().includes(query) ||
      visitor.roomNumber.toLowerCase().includes(query) ||
      (visitor.qrToken ?? '').toLowerCase().includes(query)
    );
  });
}

export function summarizeVisitors(visitors: Visitor[], now = new Date()): VisitorSummary {
  const today = localToday(now);
  return {
    totalToday: visitors.filter((item) => item.visitDate === today).length,
    pending: visitors.filter((item) => item.status === VisitorStatus.PENDING).length,
    approved: visitors.filter((item) => item.status === VisitorStatus.APPROVED).length,
    currentlyInside: visitors.filter((item) => item.status === VisitorStatus.CHECKED_IN).length,
    upcoming: visitors.filter(
      (item) =>
        (item.status === VisitorStatus.PENDING || item.status === VisitorStatus.APPROVED) && item.visitDate >= today,
    ).length,
    past: visitors.filter(
      (item) => item.status === VisitorStatus.CHECKED_OUT || item.status === VisitorStatus.EXPIRED || item.visitDate < today,
    ).length,
  };
}
