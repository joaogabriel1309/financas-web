'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export function useResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const value = await api<T>(path, { signal });
        if (!signal?.aborted) {
          setData(value);
          setError(null);
        }
      } catch (error) {
        if (!signal?.aborted)
          setError(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os dados.',
          );
      }
    },
    [path],
  );
  useEffect(() => {
    const controller = new AbortController();
    void api<T>(path, { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted) {
          setData(value);
          setError(null);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os dados.',
          );
      });
    return () => controller.abort();
  }, [path]);
  return { data, setData, error, reload, loading: data === null && !error };
}
