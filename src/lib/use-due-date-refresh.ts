'use client';

import { useEffect, useRef } from 'react';
import { dataHoje } from './months';

// Confere a virada do dia sem fazer uma requisição por minuto.
// A leitura é cancelada durante edições/gravações para não sobrescrever alterações.
export function useDueDateRefresh(
  reload: (signal?: AbortSignal) => Promise<boolean>,
  blocked = false,
) {
  const lastDay = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let refreshing = false;
    lastDay.current ??= dataHoje();

    async function refresh(force = false) {
      const today = dataHoje();
      if (
        blocked ||
        refreshing ||
        document.visibilityState !== 'visible' ||
        (!force && lastDay.current === today)
      )
        return;

      refreshing = true;
      try {
        if (await reload(controller.signal)) lastDay.current = today;
      } finally {
        refreshing = false;
      }
    }

    const onReturn = () => void refresh(true);
    const interval = window.setInterval(() => void refresh(), 60_000);
    // Também atualiza se a virada do dia aconteceu enquanto a edição estava aberta.
    void refresh();
    window.addEventListener('focus', onReturn);
    document.addEventListener('visibilitychange', onReturn);

    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener('focus', onReturn);
      document.removeEventListener('visibilitychange', onReturn);
    };
  }, [reload, blocked]);
}
