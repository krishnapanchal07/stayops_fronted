import type { InquiryFormValues } from '@/types/inquiry';

export type InquiryFormErrors = Partial<Record<keyof InquiryFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emptyInquiryForm(): InquiryFormValues {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredMoveIn: '',
    message: '',
  };
}

export function validateInquiryForm(values: InquiryFormValues): InquiryFormErrors {
  const errors: InquiryFormErrors = {};
  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();
  const email = values.email.trim();
  const phone = values.phone.replace(/\D/g, '');

  if (!firstName) errors.firstName = 'First name is required.';
  if (!lastName) errors.lastName = 'Last name is required.';

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!phone) {
    errors.phone = 'Phone is required.';
  } else if (phone.length !== 10) {
    errors.phone = 'Enter a 10-digit mobile number.';
  }

  if (values.preferredMoveIn) {
    const date = new Date(`${values.preferredMoveIn}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      errors.preferredMoveIn = 'Enter a valid move-in date.';
    }
  }

  if (!values.message.trim()) {
    errors.message = 'Add a short note so the team can follow up.';
  } else if (values.message.trim().length < 8) {
    errors.message = 'Please write a little more about your request.';
  }

  return errors;
}
