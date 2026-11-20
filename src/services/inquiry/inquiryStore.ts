import seedInquiries from '@/mock/inquiries.json';
import type { Inquiry } from '@/types/inquiry';

function clone<T>(value: T): T {
  return structuredClone(value);
}

let inquiries: Inquiry[] = clone(seedInquiries as Inquiry[]);

export const inquiryStore = {
  list(): Inquiry[] {
    return clone(inquiries);
  },

  get(id: string): Inquiry | undefined {
    const inquiry = inquiries.find((item) => item.id === id);
    return inquiry ? clone(inquiry) : undefined;
  },

  insert(inquiry: Inquiry): Inquiry {
    inquiries = [inquiry, ...inquiries];
    return clone(inquiry);
  },

  persist(next: Inquiry): Inquiry {
    inquiries = inquiries.map((item) => (item.id === next.id ? next : item));
    return clone(next);
  },
};
