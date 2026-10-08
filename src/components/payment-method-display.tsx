import { Icon } from './icon';
import {
  paymentMethodColor,
  paymentMethodContrast,
  paymentMethodIcon,
  type PaymentMethodAppearance,
} from '@/lib/payment-method-appearance';

export function PaymentMethodSymbol({
  method,
  size = 17,
}: {
  method: Pick<PaymentMethodAppearance, 'cor' | 'icone'>;
  size?: number;
}) {
  const color = paymentMethodColor(method.cor);
  return (
    <span
      className="payment-method-symbol"
      style={{ backgroundColor: color, color: paymentMethodContrast(color) }}
      aria-hidden="true"
    >
      <Icon name={paymentMethodIcon(method.icone)} size={size} />
    </span>
  );
}

export function PaymentMethodDisplay({
  method,
}: {
  method: PaymentMethodAppearance;
}) {
  return (
    <span className="payment-method-display">
      <PaymentMethodSymbol method={method} />
      <span className="payment-method-name">{method.nome}</span>
    </span>
  );
}
