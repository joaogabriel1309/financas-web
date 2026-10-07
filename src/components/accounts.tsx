'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useResource } from '@/lib/use-resource';
import { moeda } from '@/lib/format';
import type { Conta, FormaPagamento } from '@/lib/types';
import { AccountsTable } from './accounts-table';
import { EmptyState, ErrorMessage, LoadingState, Modal } from './modal';
import { Icon } from './icon';
import { MonthPicker } from './month-picker';
import { MES_REGEX, rotuloMes } from '@/lib/months';
import { useToast } from './toast-provider';
import { PaymentMethodField } from './payment-method-field';
import {
  aplicarFormaPagamento,
  salvarFormaPagamento,
} from '@/lib/account-payment-method';
import { aplicarValorConta, salvarValorConta } from '@/lib/account-value';

type Action = { type: 'pay' | 'delete'; conta: Conta };

export function Accounts({
  mes,
  initiallyOpen = false,
}: {
  mes: string;
  initiallyOpen?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const { data, setData, loading, error, reload } = useResource<Conta[]>(
    `/contas?mes=${mes}`,
  );
  const [creating, setCreating] = useState(initiallyOpen);
  const formas = useResource<FormaPagamento[]>('/formas-pagamento');
  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [tipoConta, setTipoConta] = useState('unica');
  const [methodChange, setMethodChange] = useState<{
    id: string;
    formaPagamentoId: string | null;
  } | null>(null);
  const changingMethod = useRef(false);
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [savingValueId, setSavingValueId] = useState<string | null>(null);
  const savingValue = useRef(false);
  const all = data || [];
  const filtered = all.filter(
    (conta) =>
      conta.nome
        .toLocaleLowerCase('pt-BR')
        .includes(query.toLocaleLowerCase('pt-BR')) &&
      (filter === 'all' || (filter === 'paid' ? conta.pago : !conta.pago)),
  );
  const selectedAccounts = filtered.filter((conta) =>
    selectedIds.has(conta.id),
  );
  const selectionTotal =
    selectedAccounts.reduce(
      (total, conta) => total + Math.round(Number(conta.valor) * 100),
      0,
    ) / 100;

  function closeCreate() {
    setCreating(false);
    setFormError(null);
    if (initiallyOpen) router.replace(`/contas?mes=${mes}`, { scroll: false });
  }
  function openAction(value: Action) {
    setAction(value);
    setFormError(null);
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const nome = String(form.get('nome')).trim();
    const valor = Number(form.get('valor'));
    const referencia = String(form.get('mes'));
    const recorrencia = tipoConta === 'recorrente';
    const parcela = tipoConta === 'parcelada' ? Number(form.get('parcela')) : 1;
    const formaPagamentoId =
      String(form.get('formaPagamentoId') || '').trim() || null;
    if (nome.length < 2 || !Number.isFinite(valor) || valor < 0) {
      setFormError(
        'Informe um nome com pelo menos 2 caracteres e um valor válido.',
      );
      return;
    }
    if (
      !MES_REGEX.test(referencia) ||
      !Number.isInteger(parcela) ||
      parcela < 1 ||
      parcela > 360
    ) {
      setFormError(
        'Informe um mês válido e uma quantidade inteira de até 360 parcelas.',
      );
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await api<Conta>('/contas', {
        method: 'POST',
        body: JSON.stringify({
          nome,
          valor,
          mes: referencia,
          recorrencia,
          parcela,
          formaPagamentoId,
        }),
      });
      await reload();
      closeCreate();
      toast.success('Conta cadastrada com sucesso.');
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Não foi possível cadastrar.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!action || busy) return;
    setBusy(true);
    setFormError(null);
    try {
      const caminho =
        `/contas/${action.conta.id}` +
        (action.type === 'pay' ? `?mes=${action.conta.mes}` : '');
      await api<void>(caminho, {
        method: action.type === 'pay' ? 'POST' : 'DELETE',
      });
      // Recarrega os dados para usar a data de pagamento registrada pelo servidor.
      if (action.type === 'delete') {
        setData(
          (previous) =>
            previous?.filter((conta) => conta.id !== action.conta.id) || [],
        );
        setSelectedIds((previous) => {
          const next = new Set(previous);
          next.delete(action.conta.id);
          return next;
        });
      } else await reload();
      toast.success(
        action.type === 'pay'
          ? 'Pagamento registrado com sucesso.'
          : 'Conta excluída.',
      );
      setAction(null);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir a ação.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function changePaymentMethod(
    conta: Conta,
    formaPagamentoId: string | null,
  ) {
    if (
      busy ||
      creating ||
      action ||
      changingMethod.current ||
      editingValueId !== null ||
      conta.formaPagamentoId === formaPagamentoId
    )
      return;
    changingMethod.current = true;
    setBusy(true);
    setMethodChange({ id: conta.id, formaPagamentoId });
    try {
      const vinculo = await salvarFormaPagamento(conta.id, formaPagamentoId);
      setData((previous) => aplicarFormaPagamento(previous, vinculo));
      toast.success(
        formaPagamentoId
          ? 'Forma de pagamento atualizada.'
          : 'Forma de pagamento removida.',
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível alterar a forma de pagamento.',
      );
    } finally {
      changingMethod.current = false;
      setMethodChange(null);
      setBusy(false);
    }
  }

  async function changeValue(conta: Conta, valor: number): Promise<boolean> {
    if (busy || savingValue.current || editingValueId !== conta.id)
      return false;
    if (Number(conta.valor) === valor) {
      setEditingValueId(null);
      return true;
    }
    savingValue.current = true;
    setBusy(true);
    setSavingValueId(conta.id);
    try {
      const atualizado = await salvarValorConta(conta.id, valor);
      setData((previous) => aplicarValorConta(previous, atualizado));
      setEditingValueId(null);
      toast.success('Valor da conta atualizado.');
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível alterar o valor.',
      );
      return false;
    } finally {
      savingValue.current = false;
      setBusy(false);
      setSavingValueId(null);
    }
  }

  return (
    <>
      <h1 className="sr-only">Minhas contas</h1>
      <MonthPicker
        mes={mes}
        pathname="/contas"
        disabled={busy || !!action || creating || editingValueId !== null}
      />
      {!creating && formas.error && (
        <>
          <ErrorMessage message={`Formas de pagamento: ${formas.error}`} />
          <button
            className="button secondary retry-button"
            disabled={busy}
            onClick={() => void formas.reload()}
          >
            Tentar carregar formas novamente
          </button>
        </>
      )}
      <ErrorMessage message={error} />
      {error && (
        <button
          className="button secondary retry-button"
          disabled={busy || editingValueId !== null}
          onClick={() => void reload()}
        >
          Tentar novamente
        </button>
      )}
      <section className="panel">
        <div className="accounts-toolbar">
          <div
            className="filter-tabs"
            role="group"
            aria-label="Filtrar contas por status"
          >
            {[
              { id: 'all', label: 'Todas', count: all.length },
              {
                id: 'pending',
                label: 'Em aberto',
                count: all.filter((c) => !c.pago).length,
              },
              {
                id: 'paid',
                label: 'Pagas',
                count: all.filter((c) => c.pago).length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                className={filter === tab.id ? 'selected' : ''}
                disabled={busy || editingValueId !== null}
                onClick={() => {
                  setFilter(tab.id);
                  setSelectedIds(new Set());
                }}
                aria-pressed={filter === tab.id}
              >
                {tab.label}
                <span>{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="toolbar-actions">
            <label className="search-field">
              <Icon name="search" size={18} />
              <input
                type="search"
                placeholder="Buscar uma conta…"
                aria-label="Buscar conta pelo nome"
                value={query}
                disabled={busy || editingValueId !== null}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelectedIds(new Set());
                }}
              />
            </label>
            <button
              type="button"
              className="button primary"
              disabled={busy || editingValueId !== null}
              onClick={() => {
                setCreating(true);
                setFormError(null);
                setTipoConta('unica');
              }}
            >
              <Icon name="plus" size={18} />
              Nova conta
            </button>
          </div>
        </div>
        {loading ? (
          <LoadingState />
        ) : (
          data &&
          (filtered.length ? (
            <AccountsTable
              contas={filtered}
              selectedIds={selectedIds}
              onSelectionChange={(ids) => setSelectedIds(new Set(ids))}
              onPay={(conta) => openAction({ type: 'pay', conta })}
              onDelete={(conta) => openAction({ type: 'delete', conta })}
              busyId={
                busy
                  ? action?.conta.id || methodChange?.id || savingValueId
                  : null
              }
              paymentMethods={formas.data || []}
              onPaymentMethodChange={(conta, formaPagamentoId) =>
                void changePaymentMethod(conta, formaPagamentoId)
              }
              methodSelectionDisabled={
                busy || creating || !!action || formas.loading || !!formas.error
              }
              pendingPaymentMethod={methodChange}
              editingValueId={editingValueId}
              onValueEdit={(conta) => {
                if (!busy && !creating && !action && editingValueId === null)
                  setEditingValueId(conta.id);
              }}
              onValueCancel={() => {
                if (!busy) setEditingValueId(null);
              }}
              onValueSave={changeValue}
              interactionsDisabled={
                busy || creating || !!action || editingValueId !== null
              }
            />
          ) : (
            <EmptyState
              title={
                all.length
                  ? 'Nenhuma conta encontrada'
                  : 'Nenhuma conta neste mês'
              }
              description={
                all.length
                  ? 'Tente outro nome ou altere o filtro para ver mais resultados.'
                  : 'Adicione uma conta para este mês ou selecione outro mês de referência.'
              }
            >
              {!all.length && (
                <button
                  className="button secondary"
                  disabled={busy || editingValueId !== null}
                  onClick={() => {
                    setCreating(true);
                    setFormError(null);
                  }}
                >
                  <Icon name="plus" size={17} />
                  Adicionar primeira conta
                </button>
              )}
            </EmptyState>
          ))
        )}
        {!!filtered.length && (
          <div className="table-footer">
            <span>
              {filtered.length} conta{filtered.length === 1 ? '' : 's'}
            </span>
            <div className="selection-summary">
              <span role="status" aria-live="polite" aria-atomic="true">
                {selectedAccounts.length ? (
                  <>
                    {selectedAccounts.length} selecionada
                    {selectedAccounts.length === 1 ? '' : 's'} · Soma
                    <strong>{moeda(selectionTotal)}</strong>
                  </>
                ) : (
                  'Selecione contas para somar'
                )}
              </span>
              {!!selectedAccounts.length && (
                <button
                  type="button"
                  className="clear-account-selection"
                  disabled={busy || editingValueId !== null}
                  onClick={() => setSelectedIds(new Set())}
                >
                  <Icon name="close" size={13} />
                  Limpar seleção
                </button>
              )}
            </div>
            <span>
              Total listado{' '}
              <strong>
                {moeda(
                  filtered.reduce(
                    (sum, conta) => sum + Math.round(Number(conta.valor) * 100),
                    0,
                  ) / 100,
                )}
              </strong>
            </span>
          </div>
        )}
      </section>
      {creating && (
        <Modal
          title="Nova conta"
          description="Registre o que você precisa pagar. Simples assim."
          onClose={closeCreate}
          busy={busy}
        >
          <form className="form-stack" onSubmit={create}>
            <label>
              Nome da conta
              <input
                name="nome"
                placeholder="Ex.: Internet de casa"
                minLength={2}
                maxLength={100}
                required
                disabled={busy}
              />
            </label>
            <label>
              {tipoConta === 'parcelada'
                ? 'Valor de cada parcela (R$)'
                : 'Valor mensal (R$)'}
              <input
                name="valor"
                type="number"
                inputMode="decimal"
                min="0"
                max="9999999999999.99"
                step="0.01"
                placeholder="0,00"
                required
                disabled={busy}
              />
            </label>
            <label>
              {tipoConta === 'unica' ? 'Mês da conta' : 'Mês inicial'}
              <input
                name="mes"
                type="month"
                defaultValue={mes}
                min="1900-01"
                max="9999-12"
                required
                disabled={busy}
              />
            </label>
            <label className="recurrence-field">
              <input
                name="recorrencia"
                type="checkbox"
                disabled={busy}
                checked={tipoConta === 'recorrente'}
                onChange={(event) =>
                  setTipoConta(event.target.checked ? 'recorrente' : 'unica')
                }
              />
              <span>
                Recorrência{' '}
                <small>Aparece todos os meses a partir do mês inicial.</small>
              </span>
            </label>
            <label className="recurrence-field">
              <input
                name="parcelado"
                type="checkbox"
                disabled={busy}
                checked={tipoConta === 'parcelada'}
                onChange={(event) =>
                  setTipoConta(event.target.checked ? 'parcelada' : 'unica')
                }
              />
              <span>
                Parcelas <small>Uma parcela por mês até terminar.</small>
              </span>
            </label>
            {tipoConta === 'parcelada' && (
              <label>
                Quantidade de parcelas
                <input
                  name="parcela"
                  type="number"
                  inputMode="numeric"
                  min="2"
                  max="360"
                  step="1"
                  defaultValue="2"
                  required
                  disabled={busy}
                />
              </label>
            )}
            <PaymentMethodField
              methods={formas.data}
              loading={formas.loading}
              error={formas.error}
              busy={busy}
              onRetry={() => void formas.reload()}
            />
            <p className="form-hint">
              {tipoConta === 'recorrente'
                ? 'Cada mês tem seu próprio pagamento. Marcar recorrência desmarca parcelas.'
                : tipoConta === 'parcelada'
                  ? 'O valor informado é de cada parcela. Marcar parcelas desmarca recorrência.'
                  : 'Esta conta aparece somente no mês escolhido.'}
            </p>
            <ErrorMessage message={formError} />
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={closeCreate}
                disabled={busy}
              >
                Cancelar
              </button>
              <button className="button primary" disabled={busy}>
                {busy ? 'Salvando…' : 'Cadastrar conta'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {action && (
        <Modal
          title={
            action.type === 'pay'
              ? 'Registrar pagamento?'
              : 'Excluir esta conta?'
          }
          description={
            action.type === 'pay'
              ? `Confirme o pagamento de ${action.conta.nome} em ${rotuloMes(action.conta.mes)}, no valor de ${moeda(action.conta.valor)}. Apenas este mês será marcado como pago.`
              : `A conta “${action.conta.nome}” será excluída de todos os meses, incluindo parcelas e pagamentos registrados. Essa ação não pode ser desfeita.`
          }
          onClose={() => setAction(null)}
          busy={busy}
        >
          <ErrorMessage message={formError} />
          <div className="modal-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setAction(null)}
            >
              Cancelar
            </button>
            <button
              className={`button ${action.type === 'delete' ? 'danger' : 'primary'}`}
              disabled={busy}
              onClick={() => void confirm()}
            >
              {busy
                ? 'Aguarde…'
                : action.type === 'pay'
                  ? 'Confirmar pagamento'
                  : 'Excluir conta'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
