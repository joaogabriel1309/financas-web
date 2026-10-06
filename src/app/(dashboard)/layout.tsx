import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { REFRESH_COOKIE } from '@/lib/backend';
import { AuthProvider } from '@/components/auth-provider';
import { AppShell } from '@/components/app-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = await cookies();
  if (!store.has(REFRESH_COOKIE)) redirect('/login');
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
