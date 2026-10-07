import type { Metadata } from 'next';
import { Accounts } from '@/components/accounts';
import { mesSelecionado } from '@/lib/months';

export const metadata: Metadata = { title: 'Minhas contas' };
export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ nova?: string; mes?: string | string[] }>;
}) {
  const { nova, mes: parametro } = await searchParams;
  const mes = mesSelecionado(parametro);
  return (
    <Accounts
      key={`${mes}-${nova || 'list'}`}
      mes={mes}
      initiallyOpen={nova === '1'}
    />
  );
}
