import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { IncomeEdit } from '@/components/income-edit';
import { mesSelecionado } from '@/lib/months';

export const metadata: Metadata = { title: 'Editar receita' };

export default async function EditIncomePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mes?: string | string[] }>;
}) {
  const { id } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    notFound();
  const { mes: parametro } = await searchParams;
  const mes = mesSelecionado(parametro);
  return <IncomeEdit key={id} id={id} mes={mes} />;
}
