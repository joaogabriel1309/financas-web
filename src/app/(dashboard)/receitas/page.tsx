import type { Metadata } from 'next';
import { Incomes } from '@/components/incomes';
import { mesSelecionado } from '@/lib/months';

export const metadata: Metadata = { title: 'Receitas' };

export default async function IncomesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string | string[] }>;
}) {
  const { mes: parametro } = await searchParams;
  const mes = mesSelecionado(parametro);
  return <Incomes key={mes} mes={mes} />;
}
