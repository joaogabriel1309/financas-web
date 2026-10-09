import type { Metadata } from 'next';
import { IncomeForm } from '@/components/income-form';
import { mesSelecionado } from '@/lib/months';

export const metadata: Metadata = { title: 'Nova receita' };

export default async function NewIncomePage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string | string[] }>;
}) {
  const { mes: parametro } = await searchParams;
  const mes = mesSelecionado(parametro);
  return <IncomeForm key={mes} mes={mes} />;
}
