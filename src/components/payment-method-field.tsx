'use client';

import Link from 'next/link';
import { useId } from 'react';
import type { Conta, FormaPagamento } from '@/lib/types';
import { ErrorMessage } from './modal';
import { PaymentMethodSelect } from './payment-method-select';

export function PaymentMethodField({
  methods,
  loading,
  error,
  busy,
  onRetry,
  defaultValue = '',
  selectedMethod,
}: {
  methods: FormaPagamento[] | null;
  loading: boolean;
  error: string | null;
  busy: boolean;
  onRetry: () => void;
  defaultValue?: string;
  selectedMethod?: Conta['formaPagamento'];
}) {
  const selectId = useId();
  const hintId = `${selectId}-hint`;
  return (
    <>
      <div className="form-control">
        <label htmlFor={selectId}>Forma de pagamento (opcional)</label>
        <PaymentMethodSelect
          id={selectId}
          name="formaPagamentoId"
          defaultValue={defaultValue}
          selectedMethod={selectedMethod}
          label="Forma de pagamento (opcional)"
          methods={error ? [] : methods || []}
          disabled={busy || loading || !!error}
          describedBy={hintId}
          placeholder={
            loading
              ? 'Carregando formas de pagamento…'
              : error
                ? 'Formas de pagamento indisponíveis'
                : 'Não informada'
          }
        />
      </div>
      <p className="form-hint" id={hintId}>
        {error ? (
          selectedMethod ? (
            'A forma atual será mantida. Tente novamente para escolher outra forma de pagamento.'
          ) : (
            'Você pode tentar novamente ou continuar sem forma de pagamento.'
          )
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
