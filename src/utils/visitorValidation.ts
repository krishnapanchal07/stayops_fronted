import { VisitorRelationship, type VisitorFormValues } from '@/types/visitor';
import { combineDateTime } from '@/utils/visitorRules';

export type VisitorFormErrors = Partial<Record<keyof VisitorFormValues, string>>;

export function emptyVisitorForm(): VisitorFormValues {
  return {
    visitorName: '',
    visitorPhone: '',
    visitorEmail: '',
    relationship: '',
    purpose: '',
    visitDate: '',
    expectedEntryTime: '',
    expectedExitTime: '',
    notes: '',
  };
}

export function validateVisitorForm(values: VisitorFormValues, today = new Date().toISOString().slice(0, 10)): VisitorFormErrors {
  const errors: VisitorFormErrors = {};
  if (!values.visitorName.trim()) errors.visitorName = 'Visitor name is required.';
  if (!values.visitorPhone.trim() || values.visitorPhone.replace(/\D/g, '').length < 10) {
    errors.visitorPhone = 'Enter a valid 10-digit phone number.';
  }
  if (values.visitorEmail && !values.visitorEmail.includes('@')) errors.visitorEmail = 'Enter a valid email.';
  if (!values.relationship || !Object.values(VisitorRelationship).includes(values.relationship)) {
    errors.relationship = 'Select a relationship.';
  }
  if (!values.purpose.trim()) errors.purpose = 'Purpose is required.';
  if (!values.visitDate) errors.visitDate = 'Visit date is required.';
  else if (values.visitDate < today) errors.visitDate = 'Visit date cannot be in the past.';
  if (!values.expectedEntryTime) errors.expectedEntryTime = 'Expected entry time is required.';
  if (!values.expectedExitTime) errors.expectedExitTime = 'Expected exit time is required.';
  if (values.visitDate && values.expectedEntryTime && values.expectedExitTime) {
    if (combineDateTime(values.visitDate, values.expectedExitTime) <= combineDateTime(values.visitDate, values.expectedEntryTime)) {
      errors.expectedExitTime = 'Exit time must be after entry time.';
    }
  }
  return errors;
}

export function validateRejectionReason(reason: string): string | null {
  return reason.trim() ? null : 'A reason is required.';
}
