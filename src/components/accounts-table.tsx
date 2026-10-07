'use client';

import { moeda, dataCurta } from '@/lib/format';
import type { Conta, FormaPagamento } from '@/lib/types';
import { Icon } from './icon';
import { rotuloMes } from '@/lib/months';

export function AccountsTable({
  contas,
  onPay,
  onDelete,
  busyId,
  paymentMethods = [],
  onPaymentMethodChange,
  methodSelectionDisabled = false,
  pendingPaymentMethod,
}: {
  contas: Conta[];
  onPay?: (conta: Conta) => void;
  onDelete?: (conta: Conta) => void;
  busyId?: string | null;
  paymentMethods?: FormaPagamento[];
  onPaymentMethodChange?: (
    conta: Conta,
    formaPagamentoId: string | null,
  ) => void;
  methodSelectionDisabled?: boolean;
  pendingPaymentMethod?: { id: string; formaPagamentoId: string | null } | null;
}) {
  const actions = !!onPay || !!onDelete;
  return (
    <div className="table-scroll">
      <table className="accounts-table">
        <thead>
          <tr>
            <th scope="col">CONTA</th>
            <th scope="col">MÊS</th>
            <th scope="col">FORMA DE PAGAMENTO</th>
            <th scope="col">STATUS</th>
            <th scope="col" className="align-right">
              VALOR
            </th>
            {actions && (
              <th scope="col" className="align-right">
                AÇÕES
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {contas.map((conta) => (
            <tr key={conta.id}>
              <td>
                <div className="account-name">
                  <span className={`account-icon ${conta.pago ? 'paid' : ''}`}>
                    <Icon name="wallet" size={18} />
                  </span>
                  <span>
                    <strong>{conta.nome}</strong>
                    {conta.recorrencia ? (
                      <small>Recorrência mensal</small>
                    ) : (
                      conta.parcela > 1 && (
                        <small>
                          Parcela {conta.parcelaAtual} de {conta.parcela}
                        </small>
                      )
                    )}
                    {conta.dataHoraPagamento && (
                      <small>
                        Pago em {dataCurta(conta.dataHoraPagamento)}
                      </small>
                    )}
                  </span>
                </div>
              </td>
              <td className="date-cell">{rotuloMes(conta.mes)}</td>
              <td>
                {onPaymentMethodChange ? (
                  <div className="table-method-field">
                    <select
                      aria-label={`Forma de pagamento de ${conta.nome}`}
                      title="Altera a forma da conta em todos os meses e parcelas"
                      value={
                        pendingPaymentMethod?.id === conta.id
                          ? pendingPaymentMethod.formaPagamentoId || ''
                          : conta.formaPagamentoId || ''
                      }
                      disabled={methodSelectionDisabled || !!busyId}
                      onChange={(event) =>
                        onPaymentMethodChange(conta, event.target.value || null)
                      }
                    >
                      <option value="">Não informada</option>
                      {conta.formaPagamentoId &&
                        !paymentMethods.some(
                          (method) => method.id === conta.formaPagamentoId,
                        ) && (
                          <option value={conta.formaPagamentoId} disabled>
                            {conta.formaPagamento?.nome || 'Forma indisponível'}
                          </option>
                        )}
                      {paymentMethods.map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.nome}
                        </option>
                      ))}
                    </select>
                    {pendingPaymentMethod?.id === conta.id && (
                      <small role="status">Salvando…</small>
                    )}
                  </div>
                ) : (
                  conta.formaPagamento?.nome || (
                    <span className="muted">Não informada</span>
                  )
                )}
              </td>
              <td>
                <span className={`badge ${conta.pago ? 'paid' : 'pending'}`}>
                  <span />
                  {conta.pago ? 'Paga' : 'Em aberto'}
                </span>
              </td>
              <td className="align-right amount-cell">{moeda(conta.valor)}</td>
              {actions && (
                <td>
                  <div className="row-actions">
                    {onPay && !conta.pago && (
                      <button
                        className="button small-button secondary"
                        onClick={() => onPay(conta)}
                        disabled={!!busyId}
                      >
                        <Icon name="check" size={16} />
                        Pagar
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="icon-button danger-icon"
                        onClick={() => onDelete(conta)}
                        disabled={!!busyId}
                        aria-label={`Excluir ${conta.nome}`}
                        title="Excluir conta"
                      >
                        <Icon name="trash" size={17} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
