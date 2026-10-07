import type { Metadata } from 'next';
import { Overview } from '@/components/overview';
import { mesSelecionado } from '@/lib/months';

export const metadata: Metadata = { title: 'Visão geral' };
export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string | string[] }>;
}) {
  const { mes: parametro } = await searchParams;
  const mes = mesSelecionado(parametro);
  return <Overview key={mes} mes={mes} />;
}
