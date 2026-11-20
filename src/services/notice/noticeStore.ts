import seedNotices from '@/mock/notices.json';
import seedReads from '@/mock/noticeReads.json';
import type { Notice, NoticeReadState } from '@/types/notice';

function clone<T>(value: T): T {
  return structuredClone(value);
}

let notices: Notice[] = clone(seedNotices as Notice[]);
let reads: NoticeReadState[] = clone(seedReads as NoticeReadState[]);

export const noticeStore = {
  list(): Notice[] {
    return clone(notices);
  },
  get(id: string): Notice | undefined {
    const item = notices.find((notice) => notice.id === id);
    return item ? clone(item) : undefined;
  },
  insert(record: Notice): Notice {
    notices = [record, ...notices];
    return clone(record);
  },
  persist(record: Notice): Notice {
    notices = notices.map((item) => (item.id === record.id ? record : item));
    return clone(record);
  },
  listReads(): NoticeReadState[] {
    return clone(reads);
  },
  isRead(tenantId: string, noticeId: string): boolean {
    return reads.some((item) => item.tenantId === tenantId && item.noticeId === noticeId);
  },
  markRead(tenantId: string, noticeId: string, readAt: string): NoticeReadState {
    const existing = reads.find((item) => item.tenantId === tenantId && item.noticeId === noticeId);
    if (existing) return clone(existing);
    const next: NoticeReadState = { tenantId, noticeId, readAt };
    reads = [...reads, next];
    return clone(next);
  },
};
