'use client';

import Link from 'next/link';
import { useResource } from '@/lib/use-resource';
import { useDueDateRefresh } from '@/lib/use-due-date-refresh';
import type { PrevisaoMensal } from '@/lib/types';
import { StatCard } from './page-heading';
import { ErrorMessage, LoadingState } from './modal';
import { Icon } from './icon';

export function MonthlyForecast({ mes }: { mes: string }) {
  const { data, loading, error, reload } = useResource<PrevisaoMensal>(
    `/previsao?mes=${mes}`,
  );
  useDueDateRefresh(reload, loading);
  const saldo = data ? Number(data.saldoPrevisto) : 0;

  return (
    <section className="forecast-section" aria-labelledby="forecast-heading">
      <div className="forecast-heading">
        <h2 id="forecast-heading">Previsão do mês</h2>
        <div className="forecast-actions">
          <Link className="text-link" href={`/receitas?mes=${mes}`}>
            Gerenciar receitas <Icon name="arrow" size={16} />
          </Link>
          <Link className="button secondary" href={`/receitas/nova?mes=${mes}`}>
            <Icon name="plus" size={16} />
            Nova receita
          </Link>
        </div>
      </div>
      <ErrorMessage message={error} />
      {error && (
        <button
          type="button"
          className="button secondary retry-button"
          onClick={() => void reload()}
        >
          <Icon name="refresh" size={16} /> Tentar novamente
        </button>
      )}
      {loading ? (
        <LoadingState />
      ) : (
        !error &&
        data && (
          <>
            <div className="stats-grid">
              <StatCard
                label="Receitas previstas"
                value={data.receitasPrevistas}
                description={`${data.quantidadeReceitas} entrada${data.quantidadeReceitas === 1 ? '' : 's'} prevista${data.quantidadeReceitas === 1 ? '' : 's'} no mês`}
                icon="banknote"
                tone="green"
              />
              <StatCard
                label="Despesas previstas"
                value={data.despesasPrevistas}
                description={`${data.quantidadeContas} conta${data.quantidadeContas === 1 ? '' : 's'}, incluindo pagas e em aberto`}
                icon="wallet"
                tone="amber"
              />
              <StatCard
                label="Saldo previsto"
                value={data.saldoPrevisto}
                description={
                  saldo < 0
                    ? 'Despesas maiores que as receitas.'
                    : saldo > 0
                      ? 'Receitas maiores que as despesas.'
                      : 'Receitas e despesas equilibradas.'
                }
                icon="chart"
                tone={saldo < 0 ? 'red' : saldo > 0 ? 'green' : 'neutral'}
              />
            </div>
            <p className="form-hint">
              Receitas previstas menos todas as despesas do mês. Não é saldo
              bancário e não acumula valores de meses anteriores.
            </p>
          </>
        )
      )}
    </section>
  );
}
