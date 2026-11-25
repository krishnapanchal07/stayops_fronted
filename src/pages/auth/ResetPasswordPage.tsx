import { PasswordInput } from '@/components/forms/PasswordInput';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { authService, authErrorMessage } from '@/services/auth/authService';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function ResetPasswordPage() {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();
  const [token] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '',
  );

  useEffect(() => {
    // Keep the secret only in component memory; remove it from the address bar/history.
    window.history.replaceState(window.history.state, '', window.location.pathname);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password.trim() || !confirmPassword.trim()) {
      setError('Both password fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (
      password.length < 12 ||
      password.length > 128 ||
      !/[a-z]/i.test(password) ||
      !/\d/.test(password)
    ) {
      setError('Use 12-128 characters including a letter and a number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const message = await authService.resetPassword(token, password);
      setCompleted(true);
      toast('success', 'Password updated', message);
      navigate(PATHS.login, { replace: true });
    } catch (error) {
      setError(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="typo-page-title">Reset password</h1>
      <p className="typo-secondary mt-2">Choose a new password for your StayOps account.</p>
      <p className="typo-secondary mt-2">Use 12-128 characters including a letter and a number.</p>
      {!token ? (
        <p className="typo-error mt-3" role="alert">
          This reset link is missing or invalid. Request a new link from Forgot Password.
        </p>
      ) : null}

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <PasswordInput
          label="New password"
          name="password"
          autoComplete="new-password"
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
        <Button type="submit" fullWidth disabled={loading || completed || !token}>
          {loading ? 'Updating...' : 'Update password'}
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
