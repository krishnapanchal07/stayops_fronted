import seedDocuments from '@/mock/documents.json';
import type { StayDocument } from '@/types/document';

function clone<T>(value: T): T {
  return structuredClone(value);
}

let documents: StayDocument[] = clone(seedDocuments as StayDocument[]);

export const documentStore = {
  list(): StayDocument[] {
    return clone(documents);
  },
  get(id: string): StayDocument | undefined {
    const item = documents.find((document) => document.id === id);
    return item ? clone(item) : undefined;
  },
  insert(record: StayDocument): StayDocument {
    documents = [record, ...documents];
    return clone(record);
  },
  persist(record: StayDocument): StayDocument {
    documents = documents.map((item) => (item.id === record.id ? record : item));
    return clone(record);
  },
};
