import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Accounts } from '@/components/accounts';
import { mesSelecionado } from '@/lib/months';

export const metadata: Metadata = { title: 'Minhas contas' };
export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ nova?: string | string[]; mes?: string | string[] }>;
}) {
  const { nova, mes: parametro } = await searchParams;
  const mes = mesSelecionado(parametro);
  if (nova === '1') redirect(`/contas/nova?mes=${mes}`);
  return <Accounts key={mes} mes={mes} />;
}
