import seedComments from '@/mock/complaintComments.json';
import seedEvents from '@/mock/complaintEvents.json';
import seedComplaints from '@/mock/complaints.json';
import type { Complaint, ComplaintComment, ComplaintEvent } from '@/types/complaint';

function clone<T>(value: T): T {
  return structuredClone(value);
}

let complaints: Complaint[] = clone(seedComplaints as Complaint[]);
let comments: ComplaintComment[] = clone(seedComments as ComplaintComment[]);
let events: ComplaintEvent[] = clone(seedEvents as ComplaintEvent[]);

export const complaintStore = {
  list(): Complaint[] {
    return clone(complaints);
  },
  get(id: string): Complaint | undefined {
    const item = complaints.find((complaint) => complaint.id === id);
    return item ? clone(item) : undefined;
  },
  insert(record: Complaint): Complaint {
    complaints = [record, ...complaints];
    return clone(record);
  },
  persist(record: Complaint): Complaint {
    complaints = complaints.map((item) => (item.id === record.id ? record : item));
    return clone(record);
  },
  listComments(complaintId?: string): ComplaintComment[] {
    const items = complaintId ? comments.filter((item) => item.complaintId === complaintId) : comments;
    return clone(items);
  },
  insertComment(record: ComplaintComment): ComplaintComment {
    comments = [...comments, record];
    return clone(record);
  },
  listEvents(complaintId?: string): ComplaintEvent[] {
    const items = complaintId ? events.filter((item) => item.complaintId === complaintId) : events;
    return clone(items).sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  },
  insertEvent(record: ComplaintEvent): ComplaintEvent {
    events = [...events, record];
    return clone(record);
  },
};
