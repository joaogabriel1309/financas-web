import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/toast-provider';

export const metadata: Metadata = {
  title: {
    default: 'Finanças — Seu dinheiro, com clareza',
    template: '%s | Finanças',
  },
  description:
    'Organize suas contas, acompanhe pagamentos e cuide da sua vida financeira.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
