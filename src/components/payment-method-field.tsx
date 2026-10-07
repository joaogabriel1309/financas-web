'use client';

import Link from 'next/link';
import { useId } from 'react';
import type { FormaPagamento } from '@/lib/types';
import { ErrorMessage } from './modal';

export function PaymentMethodField({
  methods,
  loading,
  error,
  busy,
  onRetry,
}: {
  methods: FormaPagamento[] | null;
  loading: boolean;
  error: string | null;
  busy: boolean;
  onRetry: () => void;
}) {
  const hintId = useId();
  return (
    <>
      <label>
        Forma de pagamento (opcional)
        <select
          name="formaPagamentoId"
          defaultValue=""
          disabled={busy || loading || !!error}
          aria-describedby={hintId}
        >
          <option value="">
            {loading
              ? 'Carregando formas de pagamento…'
              : error
                ? 'Formas de pagamento indisponíveis'
                : 'Não informada'}
          </option>
          {!error &&
            methods?.map((method) => (
              <option key={method.id} value={method.id}>
                {method.nome}
              </option>
            ))}
        </select>
      </label>
      <p className="form-hint" id={hintId}>
        {error ? (
          'Você pode tentar novamente ou cadastrar a conta sem forma de pagamento.'
        ) : !loading && !methods?.length ? (
          <>
            Nenhuma forma cadastrada.{' '}
            <Link href="/formas-pagamento">
              Cadastre uma forma de pagamento
            </Link>{' '}
            ou continue sem informar.
          </>
        ) : (
          'A forma escolhida será usada em todos os meses e parcelas desta conta.'
        )}
      </p>
      {error && (
        <>
          <ErrorMessage message={error} />
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={onRetry}
          >
            Tentar carregar formas novamente
          </button>
        </>
      )}
    </>
  );
}
