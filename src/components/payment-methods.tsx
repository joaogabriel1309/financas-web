'use client';

import { useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { useResource } from '@/lib/use-resource';
import type { FormaPagamento } from '@/lib/types';
import { dataCurta } from '@/lib/format';
import { Icon } from './icon';
import { EmptyState, ErrorMessage, LoadingState, Modal } from './modal';
import { PageHeading } from './page-heading';
import { useToast } from './toast-provider';

export function PaymentMethods() {
  const toast = useToast();
  const { data, setData, loading, error, reload } =
    useResource<FormaPagamento[]>('/formas-pagamento');
  const [editing, setEditing] = useState<FormaPagamento | 'new' | null>(null);
  const [deleting, setDeleting] = useState<FormaPagamento | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const filtered = (data || []).filter((method) =>
    method.nome
      .toLocaleLowerCase('pt-BR')
      .includes(query.toLocaleLowerCase('pt-BR')),
  );

  function edit(method: FormaPagamento | 'new') {
    setEditing(method);
    setFormError(null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || busy) return;
    const nome = String(new FormData(event.currentTarget).get('nome')).trim();
    if (nome.length < 2) {
      setFormError('Informe um nome com pelo menos 2 caracteres.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const saved = await api<FormaPagamento>(
        editing === 'new'
          ? '/formas-pagamento'
          : `/formas-pagamento/${editing.id}`,
        {
          method: editing === 'new' ? 'POST' : 'PATCH',
          body: JSON.stringify({ nome }),
        },
      );
      setData((previous) =>
        [
          ...(previous || []).filter((method) => method.id !== saved.id),
          saved,
        ].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
      );
      toast.success(
        editing === 'new'
          ? 'Forma de pagamento cadastrada.'
          : 'Forma de pagamento atualizada.',
      );
      setEditing(null);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Não foi possível salvar.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting || busy) return;
    setBusy(true);
    setFormError(null);
    try {
      await api<FormaPagamento>(`/formas-pagamento/${deleting.id}`, {
        method: 'DELETE',
      });
      setData(
        (previous) =>
          previous?.filter((method) => method.id !== deleting.id) || [],
      );
      toast.success('Forma de pagamento excluída.');
      setDeleting(null);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Não foi possível excluir.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="DO SEU JEITO"
        title="Formas de pagamento"
        description="Organize as maneiras que você usa para pagar."
      >
        <button className="button primary" onClick={() => edit('new')}>
          <Icon name="plus" size={18} />
          Nova forma de pagamento
        </button>
      </PageHeading>
      <ErrorMessage message={error} />
      {error && (
        <button
          className="button secondary retry-button"
          onClick={() => void reload()}
        >
          Tentar novamente
        </button>
      )}
      <div className="methods-toolbar">
        <span className="muted">
          {data?.length || 0} forma{data?.length === 1 ? '' : 's'} de pagamento
        </span>
        <label className="search-field">
          <Icon name="search" size={18} />
          <input
            type="search"
            placeholder="Buscar forma de pagamento…"
            aria-label="Buscar forma de pagamento pelo nome"
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
          <div className="methods-grid">
            {filtered.map((method, index) => (
              <article className="method-card" key={method.id}>
                <div className="method-card-top">
                  <span className={`method-icon tone-${index % 3}`}>
                    <Icon name="card" size={25} />
                  </span>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={`Editar ${method.nome}`}
                      onClick={() => edit(method)}
                      title="Editar"
                    >
                      <Icon name="edit" size={17} />
                    </button>
                    <button
                      className="icon-button danger-icon"
                      aria-label={`Excluir ${method.nome}`}
                      title="Excluir"
                      onClick={() => {
                        setDeleting(method);
                        setFormError(null);
                      }}
                    >
                      <Icon name="trash" size={17} />
                    </button>
                  </div>
                </div>
                <h2>{method.nome}</h2>
                <p>Cadastrada em {dataCurta(method.createdAt)}</p>
                <div className="method-card-bottom">
                  <span className="method-status">
                    <span />
                    Disponível
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="panel">
            <EmptyState
              title={
                data.length
                  ? 'Nenhuma forma encontrada'
                  : 'Como você costuma pagar?'
              }
              description={
                data.length
                  ? 'Experimente buscar por outro nome.'
                  : 'Cadastre Pix, cartão, dinheiro ou outras formas que fazem parte da sua rotina.'
              }
            >
              {!data.length && (
                <button
                  className="button secondary"
                  onClick={() => edit('new')}
                >
                  <Icon name="plus" size={17} />
                  Adicionar primeira forma
                </button>
              )}
            </EmptyState>
          </section>
        ))
      )}
      <p className="methods-note">
        <Icon name="card" size={17} />
        Use nomes fáceis de reconhecer, como Pix, cartão pessoal ou dinheiro.
      </p>
      {editing && (
        <Modal
          title={
            editing === 'new'
              ? 'Nova forma de pagamento'
              : 'Editar forma de pagamento'
          }
          description="Dê um nome que ajude você a identificar essa forma."
          busy={busy}
          onClose={() => setEditing(null)}
        >
          <form className="form-stack" onSubmit={save}>
            <label>
              Nome
              <input
                name="nome"
                placeholder="Ex.: Pix, cartão de crédito, dinheiro"
                defaultValue={editing === 'new' ? '' : editing.nome}
                minLength={2}
                maxLength={100}
                required
                disabled={busy}
              />
            </label>
            <ErrorMessage message={formError} />
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setEditing(null)}
                disabled={busy}
              >
                Cancelar
              </button>
              <button className="button primary" disabled={busy}>
                {busy ? 'Salvando…' : 'Salvar forma de pagamento'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal
          title="Excluir forma de pagamento?"
          description={`“${deleting.nome}” será excluída. Essa ação não pode ser desfeita.`}
          busy={busy}
          onClose={() => setDeleting(null)}
        >
          <ErrorMessage message={formError} />
          <div className="modal-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Cancelar
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={() => void remove()}
            >
              {busy ? 'Excluindo…' : 'Excluir forma de pagamento'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
