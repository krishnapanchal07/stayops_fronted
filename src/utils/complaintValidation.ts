import { ComplaintCategory, ComplaintPriority, type ComplaintFormValues } from '@/types/complaint';
import type { CompleteTaskValues } from '@/types/maintenance';

export type ComplaintFormErrors = Partial<Record<keyof ComplaintFormValues, string>>;
export type CompleteTaskErrors = Partial<Record<keyof CompleteTaskValues, string>>;

export function emptyComplaintForm(roomId = ''): ComplaintFormValues {
  return {
    category: '',
    title: '',
    description: '',
    priority: ComplaintPriority.MEDIUM,
    roomId,
    attachments: [],
  };
}

export function validateComplaintForm(values: ComplaintFormValues, requireRoom: boolean): ComplaintFormErrors {
  const errors: ComplaintFormErrors = {};
  if (!values.category || !Object.values(ComplaintCategory).includes(values.category)) {
    errors.category = 'Select a category.';
  }
  if (!values.title.trim()) errors.title = 'Title is required.';
  if (values.description.trim().length < 12) {
    errors.description = 'Describe the issue in at least 12 characters.';
  }
  if (!values.priority) errors.priority = 'Select a priority.';
  if (requireRoom && !values.roomId) errors.roomId = 'Your room allocation is required to raise a complaint.';
  return errors;
}

export function validateCompleteTask(values: CompleteTaskValues): CompleteTaskErrors {
  const errors: CompleteTaskErrors = {};
  if (!values.resolutionNotes.trim()) errors.resolutionNotes = 'Resolution notes are required.';
  if (!Number.isFinite(values.actualCost) || values.actualCost < 0) {
    errors.actualCost = 'Actual cost cannot be negative.';
  }
  if (!values.completedAt) errors.completedAt = 'Completion date is required.';
  return errors;
}

export function validateAssignment(staffId: string, dueDate: string): { staffId?: string; dueDate?: string } {
  const errors: { staffId?: string; dueDate?: string } = {};
  if (!staffId) errors.staffId = 'Select a maintenance staff member.';
  if (!dueDate) errors.dueDate = 'Due date is required.';
  return errors;
}

export function validateEscalation(reason: string): string | null {
  return reason.trim() ? null : 'An escalation reason is required.';
}
