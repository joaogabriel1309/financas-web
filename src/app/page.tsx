import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { REFRESH_COOKIE } from '@/lib/backend';

export default async function Home() {
  const store = await cookies();
  redirect(store.has(REFRESH_COOKIE) ? '/visao-geral' : '/login');
}
