import { TextInput } from '@/components/forms/TextInput';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { authService, authErrorMessage } from '@/services/auth/authService';
import { Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

export function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const message = await authService.forgotPassword(email);
      toast('info', 'Password reset requested', message);
    } catch (error) {
      setError(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="typo-page-title">Forgot password</h1>
      <p className="typo-secondary mt-2">Enter your email and we will send reset instructions.</p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <TextInput
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={error}
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>

      <p className="typo-secondary mt-6 text-center">
        Remembered your password?{' '}
        <Link to={PATHS.login} className="font-medium text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
