'use client';

import { moeda, dataCurta, dataCalendario } from '@/lib/format';
import { obterIconeConta } from '@/lib/account-icons';
import type { Conta, FormaPagamento } from '@/lib/types';
import { Icon } from './icon';
import { AccountDueStatus } from './account-due-status';
import { PaymentMethodSelect } from './payment-method-select';
import { PaymentMethodDisplay } from './payment-method-display';
import {
  AccountValueDisplay,
  AccountValueEditor,
} from './account-value-editor';

export function AccountsTable({
  contas,
  onPay,
  onDelete,
  onEdit,
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
  onEdit?: (conta: Conta) => void;
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
  const actions = !!onPay || !!onEdit || !!onDelete;
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
                    <Icon name={obterIconeConta(conta.icone)} size={18} />
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
                    {conta.dataVencimento && (
                      <small>
                        Vencimento: {dataCalendario(conta.dataVencimento)}
                      </small>
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
                    <PaymentMethodSelect
                      label={`Forma de pagamento de ${conta.nome}`}
                      title="Altera a forma da conta em todos os meses e parcelas"
                      methods={paymentMethods}
                      selectedMethod={conta.formaPagamento}
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
                      onChange={(id) => onPaymentMethodChange(conta, id)}
                    />
                    {pendingPaymentMethod?.id === conta.id && (
                      <small role="status">Salvando…</small>
                    )}
                  </div>
                ) : conta.formaPagamento ? (
                  <PaymentMethodDisplay method={conta.formaPagamento} />
                ) : (
                  <span className="muted">Não informada</span>
                )}
              </td>
              <td>
                <AccountDueStatus conta={conta} />
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
                    {onEdit && (
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => onEdit(conta)}
                        disabled={!!busyId || interactionsDisabled}
                        aria-label={`Editar ${conta.nome}`}
                        title="Editar conta"
                      >
                        <Icon name="edit" size={17} />
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
