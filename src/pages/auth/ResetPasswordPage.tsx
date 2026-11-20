import { PasswordInput } from '@/components/forms/PasswordInput';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

export function ResetPasswordPage() {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password.trim() || !confirmPassword.trim()) {
      setError('Both password fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    toast(
      'success',
      'Password form looks valid',
      'Reset will be connected when authentication is added.',
    );
  };

  return (
    <div>
      <h1 className="typo-page-title">Reset password</h1>
      <p className="typo-secondary mt-2">Choose a new password for your StayOps account.</p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <PasswordInput
          label="New password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <PasswordInput
          label="Confirm password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={error}
          autoComplete="new-password"
          required
        />
        <Button type="submit" fullWidth>
          Update password
        </Button>
      </form>

      <p className="typo-secondary mt-6 text-center">
        <Link to={PATHS.login} className="font-medium text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
