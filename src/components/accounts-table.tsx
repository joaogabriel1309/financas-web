'use client';

import { moeda, dataCurta } from '@/lib/format';
import type { Conta } from '@/lib/types';
import { Icon } from './icon';
import { rotuloMes } from '@/lib/months';

export function AccountsTable({
  contas,
  onPay,
  onDelete,
  busyId,
}: {
  contas: Conta[];
  onPay?: (conta: Conta) => void;
  onDelete?: (conta: Conta) => void;
  busyId?: string | null;
}) {
  const actions = !!onPay || !!onDelete;
  return (
    <div className="table-scroll">
      <table className="accounts-table">
        <thead>
          <tr>
            <th scope="col">CONTA</th>
            <th scope="col">MÊS</th>
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
