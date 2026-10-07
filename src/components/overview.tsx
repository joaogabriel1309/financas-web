'use client';

import Link from 'next/link';
import { StatCard } from './page-heading';
import { useResource } from '@/lib/use-resource';
import type { Conta } from '@/lib/types';
import { AccountsTable } from './accounts-table';
import { EmptyState, ErrorMessage, LoadingState } from './modal';
import { Icon } from './icon';
import { MonthPicker } from './month-picker';

export function Overview({ mes }: { mes: string }) {
  const {
    data: contas,
    loading,
    error,
    reload,
  } = useResource<Conta[]>(`/contas?mes=${mes}`);
  const all = contas || [];
  const paid = all.filter((conta) => conta.pago);
  const pending = all.filter((conta) => !conta.pago);
  const sum = (items: Conta[]) =>
    items.reduce(
      (total, conta) => total + Math.round(Number(conta.valor) * 100),
      0,
    ) / 100;
  const progress = all.length
    ? Math.round((paid.length / all.length) * 100)
    : 0;

  return (
    <>
      <h1 className="sr-only">Visão geral</h1>
      <MonthPicker mes={mes} pathname="/visao-geral" />
      <ErrorMessage message={error} />
      {error && (
        <button
          className="button secondary retry-button"
          onClick={() => void reload()}
        >
          <Icon name="refresh" size={16} />
          Tentar novamente
        </button>
      )}
      {loading ? (
        <LoadingState />
      ) : (
        contas && (
          <>
            <div className="stats-grid">
              <StatCard
                label="Total de contas"
                value={sum(all)}
                description={`${all.length} conta${all.length === 1 ? ' cadastrada' : 's cadastradas'}`}
                icon="wallet"
              />
              <StatCard
                label="Em aberto"
                value={sum(pending)}
                description={`${pending.length} conta${pending.length === 1 ? ' para pagar' : 's para pagar'}`}
                icon="clock"
                tone="amber"
              />
              <StatCard
                label="Já pago"
                value={sum(paid)}
                description={`${paid.length} conta${paid.length === 1 ? ' paga' : 's pagas'}`}
                icon="check"
                tone="green"
              />
            </div>
            <div className="overview-grid">
              <section className="panel recent-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Contas recentes</h2>
                    <p>Os últimos registros do mês selecionado.</p>
                  </div>
                  <Link href={`/contas?mes=${mes}`} className="text-link">
                    Ver todas
                    <Icon name="arrow" size={17} />
                  </Link>
                </div>
                {all.length ? (
                  <AccountsTable contas={all.slice(0, 5)} />
                ) : (
                  <EmptyState
                    title="Seu novo começo está aqui"
                    description="Cadastre a primeira conta e acompanhe seus pagamentos em um só lugar."
                  >
                    <Link
                      className="button secondary"
                      href={`/contas?nova=1&mes=${mes}`}
                    >
                      <Icon name="plus" size={17} />
                      Adicionar primeira conta
                    </Link>
                  </EmptyState>
                )}
              </section>
              <section className="panel progress-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Seu progresso</h2>
                    <p>Uma conta de cada vez.</p>
                  </div>
                </div>
                <div
                  className="progress-ring"
                  role="img"
                  aria-label={`${progress}% das contas estão pagas`}
                  style={{
                    background: `conic-gradient(var(--green) ${progress}%, var(--border) 0)`,
                  }}
                >
                  <div>
                    <strong>
                      {progress}
                      <small>%</small>
                    </strong>
                    <span>das contas pagas</span>
                  </div>
                </div>
                <div className="progress-legend">
                  <span>
                    <i className="green-dot" />
                    Pagas<strong>{paid.length}</strong>
                  </span>
                  <span>
                    <i className="amber-dot" />
                    Em aberto<strong>{pending.length}</strong>
                  </span>
                </div>
                <p className="progress-note">
                  {all.length === 0
                    ? 'Seu progresso aparecerá ao cadastrar a primeira conta.'
                    : progress === 100
                      ? 'Tudo em dia. Aproveite essa tranquilidade!'
                      : 'Cada pagamento é um passo para uma rotina mais tranquila.'}
                </p>
              </section>
            </div>
            <div className="insight-banner">
              <span className="insight-icon">
                <Icon name="shield" size={25} />
              </span>
              <div>
                <h3>Organização é o primeiro passo.</h3>
                <p>
                  Registre suas contas e acompanhe o que já foi pago. O resto
                  fica mais leve.
                </p>
              </div>
              <Link href="/formas-pagamento" className="text-link">
                Minhas formas de pagamento
                <Icon name="arrow" size={18} />
              </Link>
            </div>
          </>
        )
      )}
    </>
  );
}
