import seed from '@/mock/supportRequests.json';
import type { SupportComment, SupportRequest } from '@/types/support';

function clone<T>(value: T): T {
  return structuredClone(value);
}

const payload = seed as { requests: SupportRequest[]; comments: SupportComment[] };
let requests: SupportRequest[] = clone(payload.requests);
let comments: SupportComment[] = clone(payload.comments);

export const supportStore = {
  list(): SupportRequest[] {
    return clone(requests);
  },
  get(id: string): SupportRequest | undefined {
    const item = requests.find((request) => request.id === id);
    return item ? clone(item) : undefined;
  },
  insert(record: SupportRequest): SupportRequest {
    requests = [record, ...requests];
    return clone(record);
  },
  persist(record: SupportRequest): SupportRequest {
    requests = requests.map((item) => (item.id === record.id ? record : item));
    return clone(record);
  },
  commentsFor(requestId: string): SupportComment[] {
    return clone(comments.filter((item) => item.requestId === requestId));
  },
  addComment(record: SupportComment): SupportComment {
    comments = [...comments, record];
    return clone(record);
  },
};
