import type { Metadata } from 'next';
import { PaymentMethods } from '@/components/payment-methods';

export const metadata: Metadata = { title: 'Formas de pagamento' };
export default function PaymentMethodsPage() {
  return <PaymentMethods />;
}
