import { useCallback, useEffect, useState } from 'react';

export type AsyncStatus = 'loading' | 'success' | 'error';

export function useAsyncResource<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState(0);

  const reload = useCallback(() => {
    setStatus('loading');
    setError(null);
    setRequestId((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    loader()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setStatus('success');
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setData(null);
        setStatus('error');
        setError(cause instanceof Error ? cause.message : 'Unable to load this section.');
      });

    return () => {
      cancelled = true;
    };
  }, [loader, requestId]);

  return { data, status, error, reload };
}
