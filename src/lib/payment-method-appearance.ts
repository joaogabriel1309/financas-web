import type { IconName } from '@/components/icon';
import type { FormaPagamento } from './types';

export const PAYMENT_METHOD_COLOR = '#0874df';
export const PAYMENT_METHOD_ICONS = [
  { value: 'card', label: 'Cartão' },
  { value: 'wallet', label: 'Carteira' },
  { value: 'banknote', label: 'Dinheiro' },
  { value: 'bank', label: 'Banco' },
  { value: 'pix', label: 'Pix' },
  { value: 'receipt', label: 'Boleto' },
  { value: 'phone', label: 'Celular' },
  { value: 'loan', label: 'Empréstimo' },
] as const satisfies readonly { value: IconName; label: string }[];

export const PAYMENT_METHOD_COLORS = [
  { value: '#0874df', label: 'Azul' },
  { value: '#16a085', label: 'Verde' },
  { value: '#7c3aed', label: 'Roxo' },
  { value: '#db2777', label: 'Rosa' },
  { value: '#dc2626', label: 'Vermelho' },
  { value: '#ea580c', label: 'Laranja' },
  { value: '#ca8a04', label: 'Amarelo' },
  { value: '#475569', label: 'Cinza' },
] as const;

export type PaymentMethodIcon = (typeof PAYMENT_METHOD_ICONS)[number]['value'];
export type PaymentMethodAppearance = Pick<
  FormaPagamento,
  'id' | 'nome' | 'cor' | 'icone'
>;

export function paymentMethodColor(value: unknown): string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
    ? value.toLowerCase()
    : PAYMENT_METHOD_COLOR;
}

export function paymentMethodIcon(value: unknown): PaymentMethodIcon {
  return (
    PAYMENT_METHOD_ICONS.find((icon) => icon.value === value)?.value ?? 'card'
  );
}

export function paymentMethodContrast(value: string): string {
  const color = paymentMethodColor(value);
  const channels = [1, 3, 5].map((start) => {
    const channel = parseInt(color.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return luminance > 0.179 ? '#111111' : '#ffffff';
}
