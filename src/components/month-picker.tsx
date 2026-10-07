'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MES_REGEX, rotuloMes, somarMeses } from '@/lib/months';
import { Icon } from './icon';

export function MonthPicker({
  mes,
  pathname,
  disabled = false,
}: {
  mes: string;
  pathname: '/contas' | '/visao-geral';
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const bloqueado = disabled || pending;
  function selecionar(valor: string) {
    if (!MES_REGEX.test(valor) || bloqueado) return;
    startTransition(() =>
      router.push(`${pathname}?mes=${valor}`, { scroll: false }),
    );
  }
  return (
    <section
      className="month-picker panel"
      aria-label="Selecionar mês das contas"
      aria-busy={pending}
    >
      <div>
        <span className="eyebrow">MÊS DE REFERÊNCIA</span>
        <strong>{rotuloMes(mes)}</strong>
      </div>
      <div className="month-controls">
        <button
          className="icon-button previous-month"
          onClick={() => selecionar(somarMeses(mes, -1))}
          disabled={bloqueado || mes === '1900-01'}
          aria-label="Mês anterior"
        >
          <Icon name="arrow" size={18} />
        </button>
        <input
          type="month"
          aria-label="Mês de referência"
          value={mes}
          min="1900-01"
          max="9999-12"
          disabled={bloqueado}
          onChange={(event) => selecionar(event.target.value)}
        />
        <button
          className="icon-button"
          onClick={() => selecionar(somarMeses(mes, 1))}
          disabled={bloqueado || mes === '9999-12'}
          aria-label="Próximo mês"
        >
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </section>
  );
}
