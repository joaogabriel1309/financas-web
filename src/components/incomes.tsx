'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { Receita } from '@/lib/types';
import { moeda } from '@/lib/format';
import { rotuloMes } from '@/lib/months';
import { useResource } from '@/lib/use-resource';
import { useDueDateRefresh } from '@/lib/use-due-date-refresh';
import { MonthPicker } from './month-picker';
import { Icon } from './icon';
import { EmptyState, ErrorMessage, LoadingState, Modal } from './modal';
import { useToast } from './toast-provider';

export function Incomes({ mes }: { mes: string }) {
  const { data, setData, loading, error, reload } = useResource<Receita[]>(
    `/receitas?mes=${mes}`,
  );
  const toast = useToast();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState<Receita | null>(null);
  const [busy, setBusy] = useState(false);
  const deleting = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  useDueDateRefresh(reload, loading || busy || target !== null);
  const filtered = (data ?? []).filter((receita) =>
    receita.nome
      .toLocaleLowerCase('pt-BR')
      .includes(query.toLocaleLowerCase('pt-BR')),
  );
  const total =
    filtered.reduce(
      (sum, receita) => sum + Math.round(Number(receita.valor) * 100),
      0,
    ) / 100;

  async function remove() {
    if (!target || deleting.current) return;
    deleting.current = true;
    setBusy(true);
    setFormError(null);
    try {
      await api<void>(`/receitas/${target.id}`, { method: 'DELETE' });
      setData(
        (previous) =>
          previous?.filter((receita) => receita.id !== target.id) ?? [],
      );
      setTarget(null);
      toast.success('Receita excluída.');
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir a receita.',
      );
    } finally {
      deleting.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="sr-only">Receitas</h1>
      <MonthPicker
        mes={mes}
        pathname="/receitas"
        disabled={busy || target !== null}
      />
      <ErrorMessage message={error} />
      {error && (
        <button
          className="button secondary retry-button"
          type="button"
          disabled={busy || target !== null}
          onClick={() => void reload()}
        >
          <Icon name="refresh" size={16} />
          Tentar novamente
        </button>
      )}
      <section
        className="panel accounts-panel"
        aria-label="Receitas previstas no mês"
      >
        <div className="accounts-toolbar">
          <div>
            <h2>Receitas</h2>
            <p className="form-hint">
              Salário e outras entradas previstas para este mês.
            </p>
          </div>
          <div className="toolbar-actions">
            <label className="search-field">
              <Icon name="search" size={18} />
              <input
                type="search"
                placeholder="Buscar uma receita..."
                aria-label="Buscar uma receita"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={busy}
              />
            </label>
            <Link className="button primary" href={`/receitas/nova?mes=${mes}`}>
              <Icon name="plus" size={17} />
              Nova receita
            </Link>
          </div>
        </div>
        {loading ? (
          <LoadingState />
        ) : (
          data && (
            <>
              {filtered.length ? (
                <div className="table-scroll">
                  <table className="accounts-table income-table">
                    <thead>
                      <tr>
                        <th scope="col">RECEITA</th>
                        <th scope="col">TIPO</th>
                        <th scope="col" className="align-right">
                          VALOR PREVISTO
                        </th>
                        <th scope="col" className="align-right">
                          AÇÕES
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((receita) => (
                        <tr key={receita.id}>
                          <td className="account-name-cell">
                            <div className="account-name">
                              <span className="account-icon">
                                <Icon name="banknote" size={18} />
                              </span>
                              <span>
                                <strong>{receita.nome}</strong>
                                <small>
                                  {receita.recorrencia
                                    ? 'A partir de '
                                    : 'Entrada em '}
                                  {rotuloMes(receita.mesReferencia)}
                                </small>
                              </span>
                            </div>
                          </td>
                          <td className="account-status-cell">
                            <span className="income-type">
                              {receita.recorrencia
                                ? 'Recorrência mensal'
                                : 'Avulsa'}
                            </span>
                          </td>
                          <td className="align-right amount-cell">
                            {moeda(receita.valor)}
                          </td>
                          <td className="account-actions-cell">
                            <div className="row-actions">
                              <button
                                type="button"
                                className="icon-button"
                                disabled={busy || target !== null}
                                aria-label={`Editar ${receita.nome}`}
                                title="Editar receita"
                                onClick={() =>
                                  router.push(
                                    `/receitas/${receita.id}/editar?mes=${mes}`,
                                  )
                                }
                              >
                                <Icon name="edit" size={17} />
                              </button>
                              <button
                                type="button"
                                className="icon-button danger-icon"
                                disabled={busy || target !== null}
                                aria-label={`Excluir ${receita.nome}`}
                                title="Excluir receita"
                                onClick={() => {
                                  setTarget(receita);
                                  setFormError(null);
                                }}
                              >
                                <Icon name="trash" size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title={
                    query
                      ? 'Nenhuma receita encontrada'
                      : 'Nenhuma receita neste mês'
                  }
                  description={
                    query
                      ? 'Tente buscar por outro nome.'
                      : 'Cadastre salário e outras entradas para montar sua previsão mensal.'
                  }
                />
              )}
              <div className="table-footer">
                <span>
                  {filtered.length} receita{filtered.length === 1 ? '' : 's'}
                </span>
                <span>
                  Total previsto desta lista<strong>{moeda(total)}</strong>
                </span>
              </div>
            </>
          )
        )}
      </section>
      {target && (
        <Modal
          title="Excluir receita?"
          description={
            target.recorrencia
              ? 'A receita recorrente será removida de todos os meses, inclusive os anteriores. Isso altera as previsões, mas não altera contas nem pagamentos.'
              : 'A receita será removida do mês informado e deixará de compor a previsão.'
          }
          busy={busy}
          onClose={() => {
            if (!deleting.current) setTarget(null);
          }}
        >
          <p>
            <strong>{target.nome}</strong> · {moeda(target.valor)}
          </p>
          <ErrorMessage message={formError} />
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => setTarget(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="button danger"
              disabled={busy}
              onClick={() => void remove()}
            >
              {busy
                ? 'Excluindo…'
                : target.recorrencia
                  ? 'Excluir de todos os meses'
                  : 'Excluir receita'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
