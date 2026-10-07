import type { IconName } from '@/components/icon';

export const ACCOUNT_ICONS = [
  { value: 'wallet', label: 'Carteira' },
  { value: 'home', label: 'Casa' },
  { value: 'car', label: 'Carro' },
  { value: 'motorcycle', label: 'Moto' },
  { value: 'fuel', label: 'Gasolina' },
  { value: 'loan', label: 'Empréstimo' },
  { value: 'health-plan', label: 'Plano de saúde' },
  { value: 'cart', label: 'Mercado' },
  { value: 'heart', label: 'Saúde' },
  { value: 'book', label: 'Estudos' },
  { value: 'wifi', label: 'Internet' },
  { value: 'bolt', label: 'Energia' },
  { value: 'coffee', label: 'Alimentação' },
  { value: 'phone', label: 'Telefone' },
  { value: 'card', label: 'Cartão' },
  { value: 'receipt', label: 'Boleto' },
] as const satisfies readonly { value: IconName; label: string }[];

export type AccountIconName = (typeof ACCOUNT_ICONS)[number]['value'];

export function obterIconeConta(value: unknown): AccountIconName {
  return ACCOUNT_ICONS.find((icon) => icon.value === value)?.value ?? 'wallet';
}
