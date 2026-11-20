import { useAppSelector } from '@/hooks/useAppSelector';
import { selectCurrentUser } from '@/store/selectors/authSelectors';

export function useCurrentUser() {
  return useAppSelector(selectCurrentUser);
}
