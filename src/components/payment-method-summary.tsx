'use client';

import {
  ALL_PAYMENT_METHODS,
  moedaCentavos,
  nomeResumoPagamento,
  type PaymentMethodTotal,
} from '@/lib/payment-method-summary';
import { rotuloMes } from '@/lib/months';
import { PaymentMethodDisplay } from './payment-method-display';
import { Icon } from './icon';

export function PaymentMethodSummary({
  grupos,
  mes,
  selectedId,
  disabled,
  onSelect,
}: {
  grupos: PaymentMethodTotal[];
  mes: string;
  selectedId: string;
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="payment-summary" aria-labelledby="payment-summary-heading">
      <div className="payment-summary-heading">
        <h2 id="payment-summary-heading">Resumo por forma de pagamento</h2>
        <p id="payment-summary-hint">
          Totais de {rotuloMes(mes)}, sem limitar pela busca ou pelo status.
          Clique em uma forma para filtrar a listagem.
        </p>
      </div>
      <div
        className="payment-summary-grid"
        role="group"
        aria-labelledby="payment-summary-heading"
        aria-describedby="payment-summary-hint"
      >
        {grupos.map((grupo) => {
          const selected = grupo.id === selectedId;
          const nome = nomeResumoPagamento(grupo);
          return (
            <button
              key={grupo.id}
              type="button"
              className="payment-summary-card"
              aria-pressed={selected}
              disabled={disabled}
              title={
                grupo.id === ALL_PAYMENT_METHODS
                  ? 'Mostrar contas de todas as formas de pagamento'
                  : `Filtrar contas: ${nome}`
              }
              onClick={() =>
                onSelect(selected ? ALL_PAYMENT_METHODS : grupo.id)
              }
            >
              <span className="payment-summary-card-top">
                {grupo.forma ? (
                  <PaymentMethodDisplay method={grupo.forma} />
                ) : (
                  <span className="payment-method-display">
                    <span className="payment-summary-neutral" aria-hidden="true">
                      <Icon name="wallet" size={17} />
                    </span>
                    <span className="payment-method-name">{nome}</span>
                  </span>
                )}
                {selected && (
                  <span className="payment-summary-selected" aria-hidden="true">
                    <Icon name="check" size={17} />
                  </span>
                )}
              </span>
              <strong className="payment-summary-value">
                {moedaCentavos(grupo.total)}
              </strong>
              <span className="payment-summary-count">
                {grupo.quantidade} conta{grupo.quantidade === 1 ? '' : 's'}
              </span>
              <span className="payment-summary-breakdown">
                <span>
                  Em aberto <b>{moedaCentavos(grupo.emAberto)}</b>
                </span>
                <span>
                  Pago <b>{moedaCentavos(grupo.pago)}</b>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="form-hint">
        Valores associados às contas deste mês, incluindo a parcela de cada
        compra. Não é uma fatura: não considera fechamento, limite ou compras
        não cadastradas.
      </p>
    </section>
  );
}
