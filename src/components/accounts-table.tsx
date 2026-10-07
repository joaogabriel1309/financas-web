'use client';

import { moeda, dataCurta } from '@/lib/format';
import type { Conta, FormaPagamento } from '@/lib/types';
import { Icon } from './icon';
import {
  AccountValueDisplay,
  AccountValueEditor,
} from './account-value-editor';

export function AccountsTable({
  contas,
  onPay,
  onDelete,
  busyId,
  paymentMethods = [],
  onPaymentMethodChange,
  methodSelectionDisabled = false,
  pendingPaymentMethod,
  editingValueId,
  onValueEdit,
  onValueSave,
  onValueCancel,
  interactionsDisabled = false,
  selectedIds = new Set<string>(),
  onSelectionChange,
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
  editingValueId?: string | null;
  onValueEdit?: (conta: Conta) => void;
  onValueSave?: (conta: Conta, valor: number) => Promise<boolean>;
  onValueCancel?: () => void;
  interactionsDisabled?: boolean;
  selectedIds?: ReadonlySet<string>;
  onSelectionChange?: (ids: string[]) => void;
}) {
  const actions = !!onPay || !!onDelete;
  const selectionDisabled = !!busyId || interactionsDisabled;
  const allSelected =
    contas.length > 0 && contas.every((conta) => selectedIds.has(conta.id));
  const someSelected =
    !allSelected && contas.some((conta) => selectedIds.has(conta.id));

  function toggleSelection(id: string) {
    if (!onSelectionChange || selectionDisabled) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange([...next]);
  }
  return (
    <div className="table-scroll">
      <table className="accounts-table">
        <thead>
          <tr>
            {onSelectionChange && (
              <th scope="col" className="selection-cell">
                <input
                  type="checkbox"
                  className="account-selection-checkbox"
                  aria-label="Selecionar todas as contas da lista"
                  title="Selecionar todas as contas da lista"
                  aria-checked={someSelected ? 'mixed' : allSelected}
                  checked={allSelected}
                  ref={(element) => {
                    if (element) element.indeterminate = someSelected;
                  }}
                  disabled={selectionDisabled}
                  onChange={(event) =>
                    onSelectionChange(
                      event.target.checked
                        ? contas.map((conta) => conta.id)
                        : [],
                    )
                  }
                />
              </th>
            )}
            <th scope="col">CONTA</th>
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
            <tr
              key={conta.id}
              className={
                onSelectionChange
                  ? `selectable-account-row ${selectedIds.has(conta.id) ? 'account-row-selected' : ''}`
                  : undefined
              }
              aria-selected={
                onSelectionChange ? selectedIds.has(conta.id) : undefined
              }
              onClick={
                onSelectionChange
                  ? (event) => {
                      const target = event.target as HTMLElement;
                      if (
                        target.closest(
                          'button, a, input, select, textarea, label, [role="button"]',
                        )
                      )
                        return;
                      toggleSelection(conta.id);
                    }
                  : undefined
              }
            >
              {onSelectionChange && (
                <td className="selection-cell">
                  <input
                    type="checkbox"
                    className="account-selection-checkbox"
                    aria-label={`Selecionar ${conta.nome}`}
                    title={`Selecionar ${conta.nome}`}
                    checked={selectedIds.has(conta.id)}
                    disabled={selectionDisabled}
                    onChange={() => toggleSelection(conta.id)}
                  />
                </td>
              )}
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
                      disabled={
                        methodSelectionDisabled ||
                        !!busyId ||
                        interactionsDisabled
                      }
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
              <td className="align-right amount-cell">
                {onValueEdit && onValueSave && onValueCancel ? (
                  editingValueId === conta.id ? (
                    <AccountValueEditor
                      conta={conta}
                      busy={!!busyId}
                      onSave={(valor) => onValueSave(conta, valor)}
                      onCancel={onValueCancel}
                    />
                  ) : (
                    <AccountValueDisplay
                      conta={conta}
                      disabled={!!busyId || interactionsDisabled}
                      onEdit={() => onValueEdit(conta)}
                    />
                  )
                ) : (
                  moeda(conta.valor)
                )}
              </td>
              {actions && (
                <td>
                  <div className="row-actions">
                    {onPay && !conta.pago && (
                      <button
                        className="button small-button secondary"
                        onClick={() => onPay(conta)}
                        disabled={!!busyId || interactionsDisabled}
                      >
                        <Icon name="check" size={16} />
                        Pagar
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="icon-button danger-icon"
                        onClick={() => onDelete(conta)}
                        disabled={!!busyId || interactionsDisabled}
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
