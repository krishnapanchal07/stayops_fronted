import { useAppDispatch } from '@/hooks/useAppDispatch';
import { showToast } from '@/store/slices/uiSlice';
import type { ToastVariant } from '@/types/ui';
import { useCallback } from 'react';

export function useToast() {
  const dispatch = useAppDispatch();

  return useCallback(
    (variant: ToastVariant, title: string, description?: string) => {
      dispatch(showToast({ variant, title, description }));
    },
    [dispatch],
  );
}
