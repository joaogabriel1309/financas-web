'use client';

import Link from 'next/link';
import type { Conta } from '@/lib/types';
import { useResource } from '@/lib/use-resource';
import { AccountCreate } from './account-create';
import { ErrorMessage, LoadingState } from './modal';

export function AccountEdit({ id, mes }: { id: string; mes: string }) {
  const { data, loading, error, reload } = useResource<Conta>(`/contas/${id}`);

  if (loading) return <LoadingState />;

  if (!data) {
    return (
      <div className="form-stack">
        <h1>Editar conta</h1>
        <ErrorMessage message={error} />
        <div className="account-create-actions">
          <Link className="button secondary" href={`/contas?mes=${mes}`}>
            Voltar para contas
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
  }

  return <AccountCreate key={data.id} mes={mes} conta={data} />;
}
