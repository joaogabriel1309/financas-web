import type { Metadata } from 'next';
import { Accounts } from '@/components/accounts';

export const metadata: Metadata = { title: 'Minhas contas' };
export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ nova?: string }>;
}) {
  const { nova } = await searchParams;
  return <Accounts key={nova || 'list'} initiallyOpen={nova === '1'} />;
}
