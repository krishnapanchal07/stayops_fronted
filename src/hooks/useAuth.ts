import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { selectAuth } from '@/store/selectors/authSelectors';
import { loginUser, logoutUser } from '@/store/slices/authSlice';

export function useAuth() {
  const auth = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();

  return {
    ...auth,
    loading: auth.status === 'loading',
    login: (email: string, password: string) => dispatch(loginUser({ email, password })),
    logout: () => dispatch(logoutUser()),
  };
}
