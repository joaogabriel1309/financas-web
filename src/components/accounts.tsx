'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useResource } from '@/lib/use-resource';
import { moeda } from '@/lib/format';
import type { Conta } from '@/lib/types';
import { AccountsTable } from './accounts-table';
import { EmptyState, ErrorMessage, LoadingState, Modal } from './modal';
import { PageHeading } from './page-heading';
import { Icon } from './icon';

type Action = { type: 'pay' | 'delete'; conta: Conta };

export function Accounts({
  initiallyOpen = false,
}: {
  initiallyOpen?: boolean;
}) {
  const router = useRouter();
  const { data, setData, loading, error, reload } =
    useResource<Conta[]>('/contas');
  const [creating, setCreating] = useState(initiallyOpen);
  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const all = data || [];
  const filtered = all.filter(
    (conta) =>
      conta.nome
        .toLocaleLowerCase('pt-BR')
        .includes(query.toLocaleLowerCase('pt-BR')) &&
      (filter === 'all' || (filter === 'paid' ? conta.pago : !conta.pago)),
  );

  function closeCreate() {
    setCreating(false);
    setFormError(null);
    if (initiallyOpen) router.replace('/contas', { scroll: false });
  }
  function openAction(value: Action) {
    setAction(value);
    setFormError(null);
    setNotice(null);
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const nome = String(form.get('nome')).trim();
    const valor = Number(form.get('valor'));
    if (nome.length < 2 || !Number.isFinite(valor) || valor < 0) {
      setFormError(
        'Informe um nome com pelo menos 2 caracteres e um valor válido.',
      );
      return;
    }
    setBusy(true);
    setFormError(null);
    setNotice(null);
    try {
      const created = await api<Conta>('/contas', {
        method: 'POST',
        body: JSON.stringify({ nome, valor }),
      });
      setData((previous) => [created, ...(previous || [])]);
      closeCreate();
      setNotice('Conta cadastrada com sucesso.');
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
      await api<void>(`/contas/${action.conta.id}`, {
        method: action.type === 'pay' ? 'POST' : 'DELETE',
      });
      // Recarrega os dados para usar a data de pagamento registrada pelo servidor.
      if (action.type === 'delete')
        setData(
          (previous) =>
            previous?.filter((conta) => conta.id !== action.conta.id) || [],
        );
      else await reload();
      setNotice(
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

  return (
    <>
      <PageHeading
        eyebrow="ORGANIZAÇÃO DO DIA A DIA"
        title="Minhas contas"
        description="Tudo o que você precisa pagar, em um só lugar."
      >
        <button
          className="button primary"
          onClick={() => {
            setCreating(true);
            setFormError(null);
            setNotice(null);
          }}
        >
          <Icon name="plus" size={18} />
          Nova conta
        </button>
      </PageHeading>
      {notice && (
        <div className="success-message" role="status">
          <Icon name="check" size={18} />
          {notice}
          <button
            className="icon-button"
            aria-label="Dispensar aviso"
            onClick={() => setNotice(null)}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      <ErrorMessage message={error} />
      {error && (
        <button
          className="button secondary retry-button"
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
                onClick={() => setFilter(tab.id)}
                aria-pressed={filter === tab.id}
              >
                {tab.label}
                <span>{tab.count}</span>
              </button>
            ))}
          </div>
          <label className="search-field">
            <Icon name="search" size={18} />
            <input
              type="search"
              placeholder="Buscar uma conta…"
              aria-label="Buscar conta pelo nome"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        {loading ? (
          <LoadingState />
        ) : (
          data &&
          (filtered.length ? (
            <AccountsTable
              contas={filtered}
              onPay={(conta) => openAction({ type: 'pay', conta })}
              onDelete={(conta) => openAction({ type: 'delete', conta })}
              busyId={busy ? action?.conta.id : null}
            />
          ) : (
            <EmptyState
              title={
                all.length
                  ? 'Nenhuma conta encontrada'
                  : 'Vamos organizar suas contas?'
              }
              description={
                all.length
                  ? 'Tente outro nome ou altere o filtro para ver mais resultados.'
                  : 'Adicione sua primeira conta e acompanhe cada pagamento.'
              }
            >
              {!all.length && (
                <button
                  className="button secondary"
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
            <span>
              Total desta seleção{' '}
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
              Valor (R$)
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
              ? `Confirme o pagamento de ${action.conta.nome} no valor de ${moeda(action.conta.valor)}.`
              : `A conta “${action.conta.nome}” será excluída. Essa ação não pode ser desfeita.`
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
