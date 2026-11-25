import { Checkbox } from '@/components/forms/Checkbox';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { TextInput } from '@/components/forms/TextInput';
import { Button } from '@/components/ui/Button';
import { AUTH_ERRORS } from '@/constants/authErrors';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { getHomePath, PATHS } from '@/routes/paths';
import { loginUser } from '@/store/slices/authSlice';
import { Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface LoginErrors {
  email?: string;
  password?: string;
  form?: string;
}

export function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<LoginErrors>({});

  const validate = (): LoginErrors => {
    const next: LoginErrors = {};
    if (!email.trim()) {
      next.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = 'Enter a valid email address.';
    }
    if (!password.trim()) {
      next.password = 'Password is required.';
    }
    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const result = await login(email, password, remember);
    if (loginUser.fulfilled.match(result)) {
      toast('success', `Welcome back, ${result.payload.user.name}`);
      navigate(getHomePath(result.payload.role), { replace: true });
      return;
    }

    const message = typeof result.payload === 'string' ? result.payload : AUTH_ERRORS.unexpected;
    setErrors({ form: message });
    toast('error', 'Login failed', message);
  };

  return (
    <div>
      <h1 className="typo-page-title">Welcome Back 👋</h1>
      <p className="typo-secondary mt-2">Login to your account.</p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {errors.form ? (
          <p className="typo-error rounded-xl bg-danger-soft px-3 py-2" role="alert">
            {errors.form}
          </p>
        ) : null}
        <TextInput
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />
        <PasswordInput
          name="password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          required
        />

        <div className="flex items-center justify-between gap-3">
          <Checkbox
            label="Remember me"
            name="remember"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          <Link
            to={PATHS.forgotPassword}
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Signing in…' : 'Login'}
        </Button>
      </form>

      <p className="typo-secondary mt-6 text-center">
        Looking for a room?{' '}
        <Link to={PATHS.findRoom} className="font-medium text-primary hover:underline">
          Browse rooms
        </Link>
      </p>
      <p className="typo-secondary mt-3 text-center">
        New here?{' '}
        <Link to={PATHS.register} className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
