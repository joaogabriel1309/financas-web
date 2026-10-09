'use client';

import Link from 'next/link';
import type { Receita } from '@/lib/types';
import { useResource } from '@/lib/use-resource';
import { IncomeForm } from './income-form';
import { ErrorMessage, LoadingState } from './modal';

export function IncomeEdit({ id, mes }: { id: string; mes: string }) {
  const { data, loading, error, reload } = useResource<Receita>(
    `/receitas/${id}`,
  );
  if (loading) return <LoadingState />;
  if (!data)
    return (
      <div className="form-stack">
        <h1>Editar receita</h1>
        <ErrorMessage message={error} />
        <div className="account-create-actions">
          <Link className="button secondary" href={`/receitas?mes=${mes}`}>
            Voltar para receitas
          </Link>
          <button
            type="button"
            className="button primary"
            onClick={() => void reload()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  return <IncomeForm key={data.id} mes={mes} receita={data} />;
}
