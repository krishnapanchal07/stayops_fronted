import { AuthLayout } from '@/layouts/AuthLayout';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { GuestRoute } from '@/routes/GuestRoute';
import { PATHS } from '@/routes/paths';
import { Navigate, type RouteObject } from 'react-router-dom';

export const authRoutes: RouteObject[] = [
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: PATHS.login, element: <LoginPage /> },
          { path: PATHS.forgotPassword, element: <ForgotPasswordPage /> },
          { path: PATHS.resetPassword, element: <ResetPasswordPage /> },
          { path: PATHS.register, element: <RegisterPage /> },
          { path: '/auth', element: <Navigate to={PATHS.login} replace /> },
        ],
      },
    ],
  },
];
