import type { Metadata } from 'next';
import { TelegramIntegration } from '@/components/telegram-integration';

export const metadata: Metadata = { title: 'Integrações' };
export default function IntegrationsPage() {
  return <TelegramIntegration />;
}
