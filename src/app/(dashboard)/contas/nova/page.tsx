import type { Metadata } from 'next';
import { AccountCreate } from '@/components/account-create';
import { mesSelecionado } from '@/lib/months';

export const metadata: Metadata = { title: 'Nova conta' };

export default async function NewAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string | string[] }>;
}) {
  const { mes: parametro } = await searchParams;
  const mes = mesSelecionado(parametro);
  return <AccountCreate key={mes} mes={mes} />;
}
