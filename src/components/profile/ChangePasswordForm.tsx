import { PasswordInput } from '@/components/forms/PasswordInput';
import { Button } from '@/components/ui/Button';
import type { ChangePasswordValues } from '@/types/support';
import type { ChangePasswordErrors } from '@/utils/supportValidation';

interface ChangePasswordFormProps {
  values: ChangePasswordValues;
  errors: ChangePasswordErrors;
  saving: boolean;
  onChange: (values: ChangePasswordValues) => void;
  onSubmit: () => void;
}

export function ChangePasswordForm({ values, errors, saving, onChange, onSubmit }: ChangePasswordFormProps) {
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <PasswordInput
        label="Current password"
        name="currentPassword"
        value={values.currentPassword}
        error={errors.currentPassword}
        autoComplete="current-password"
        onChange={(event) => onChange({ ...values, currentPassword: event.target.value })}
      />
      <PasswordInput
        label="New password"
        name="newPassword"
        value={values.newPassword}
        error={errors.newPassword}
        autoComplete="new-password"
        onChange={(event) => onChange({ ...values, newPassword: event.target.value })}
      />
      <PasswordInput
        label="Confirm password"
        name="confirmPassword"
        value={values.confirmPassword}
        error={errors.confirmPassword}
        autoComplete="new-password"
        onChange={(event) => onChange({ ...values, confirmPassword: event.target.value })}
      />
      <Button type="submit" disabled={saving}>
        {saving ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  );
}
