import { LeaveType, type LeaveFormValues } from '@/types/leave';

export type LeaveFormErrors = Partial<Record<keyof LeaveFormValues, string>>;

export function emptyLeaveForm(): LeaveFormValues {
  return {
    leaveType: '',
    startDate: '',
    startTime: '',
    expectedReturnDate: '',
    expectedReturnTime: '',
    reason: '',
  };
}

export function validateLeaveForm(values: LeaveFormValues, today = new Date().toISOString().slice(0, 10)): LeaveFormErrors {
  const errors: LeaveFormErrors = {};
  if (!values.leaveType || !Object.values(LeaveType).includes(values.leaveType)) {
    errors.leaveType = 'Select a leave type.';
  }
  if (!values.startDate) errors.startDate = 'Start date is required.';
  else if (values.startDate < today) errors.startDate = 'Start date cannot be in the past.';
  if (!values.startTime) errors.startTime = 'Start time is required.';
  if (!values.expectedReturnDate) errors.expectedReturnDate = 'Return date is required.';
  if (!values.expectedReturnTime) errors.expectedReturnTime = 'Return time is required.';
  if (!values.reason.trim() || values.reason.trim().length < 8) {
    errors.reason = 'Describe the reason in at least 8 characters.';
  }
  if (values.startDate && values.startTime && values.expectedReturnDate && values.expectedReturnTime) {
    const start = new Date(`${values.startDate}T${values.startTime}:00`);
    const end = new Date(`${values.expectedReturnDate}T${values.expectedReturnTime}:00`);
    if (end <= start) errors.expectedReturnDate = 'Return must be after the start date and time.';
  }
  return errors;
}
