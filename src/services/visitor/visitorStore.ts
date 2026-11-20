import seedVisitors from '@/mock/visitors.json';
import type { Visitor } from '@/types/visitor';

function clone<T>(value: T): T {
  return structuredClone(value);
}

let visitors: Visitor[] = clone(seedVisitors as Visitor[]);

export const visitorStore = {
  list(): Visitor[] {
    return clone(visitors);
  },
  get(id: string): Visitor | undefined {
    const item = visitors.find((visitor) => visitor.id === id);
    return item ? clone(item) : undefined;
  },
  findByCode(code: string): Visitor | undefined {
    const normalized = code.trim().toLowerCase();
    const item = visitors.find(
      (visitor) =>
        visitor.visitorCode.toLowerCase() === normalized || (visitor.qrToken ?? '').toLowerCase() === normalized,
    );
    return item ? clone(item) : undefined;
  },
  insert(record: Visitor): Visitor {
    visitors = [record, ...visitors];
    return clone(record);
  },
  persist(record: Visitor): Visitor {
    visitors = visitors.map((item) => (item.id === record.id ? record : item));
    return clone(record);
  },
};
