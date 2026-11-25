import { TextInput } from '@/components/forms/TextInput';
import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/ui/Button';
import type { InquiryFormValues } from '@/types/inquiry';
import { emptyInquiryForm, validateInquiryForm, type InquiryFormErrors } from '@/utils/inquiryValidation';
import { formatINR } from '@/utils/format';
import { useState, type FormEvent } from 'react';

interface InquiryFormProps {
  listingTitle: string;
  propertyName: string;
  monthlyRent: number;
  initialValues?: Partial<InquiryFormValues>;
  lockIdentity?: boolean;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: InquiryFormValues) => Promise<void>;
}

export function InquiryForm({
  listingTitle,
  propertyName,
  monthlyRent,
  initialValues,
  lockIdentity = false,
  submitting = false,
  onCancel,
  onSubmit,
}: InquiryFormProps) {
  const [values, setValues] = useState<InquiryFormValues>({ ...emptyInquiryForm(), ...initialValues });
  const [errors, setErrors] = useState<InquiryFormErrors>({});

  const update = <K extends keyof InquiryFormValues>(key: K, value: InquiryFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const nextErrors = validateInquiryForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit(values);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="rounded-xl bg-background px-4 py-3">
        <p className="font-semibold text-text">{listingTitle}</p>
        <p className="typo-secondary mt-0.5">
          {propertyName} · {formatINR(monthlyRent)} /month
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="First name"
          name="firstName"
          maxLength={60}
          value={values.firstName}
          onChange={(event) => update('firstName', event.target.value)}
          error={errors.firstName}
          disabled={lockIdentity || submitting}
          required
        />
        <TextInput
          label="Last name"
          name="lastName"
          maxLength={60}
          value={values.lastName}
          onChange={(event) => update('lastName', event.target.value)}
          error={errors.lastName}
          disabled={lockIdentity || submitting}
          required
        />
      </div>

      <TextInput
        label="Email"
        name="email"
        maxLength={320}
        type="email"
        value={values.email}
        onChange={(event) => update('email', event.target.value)}
        error={errors.email}
        disabled={lockIdentity || submitting}
        required
      />
      <TextInput
        label="Phone"
        name="phone"
        maxLength={20}
        value={values.phone}
        onChange={(event) => update('phone', event.target.value)}
        error={errors.phone}
        required
      />
      <TextInput
        label="Preferred move-in"
        name="preferredMoveIn"
        type="date"
        value={values.preferredMoveIn}
        onChange={(event) => update('preferredMoveIn', event.target.value)}
        error={errors.preferredMoveIn}
      />
      <Textarea
        label="Message"
        name="message"
        maxLength={2000}
        rows={4}
        value={values.message}
        onChange={(event) => update('message', event.target.value)}
        error={errors.message}
        helperText="Tell the team why this room works for you."
        required
      />

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Inquiry'}
        </Button>
      </div>
    </form>
  );
}
