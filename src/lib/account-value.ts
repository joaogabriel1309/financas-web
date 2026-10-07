import { api } from './api';
import type { Conta } from './types';

export const MAX_VALOR_CONTA = 9_999_999_999_999.99;
export type ValorContaAtualizado = Pick<Conta, 'id' | 'valor'>;

export function lerValorConta(texto: string): number | null {
  const valor = texto.trim();
  const brasileiro =
    /^\d+(?:,\d{1,2})?$/.test(valor) ||
    /^\d{1,3}(?:\.\d{3})+,\d{1,2}$/.test(valor);
  const decimal = /^\d+(?:\.\d{1,2})?$/.test(valor);
  if (!brasileiro && !decimal) return null;
  const numero = Number(
    valor.includes(',') ? valor.replaceAll('.', '').replace(',', '.') : valor,
  );
  return Number.isFinite(numero) && numero >= 0 && numero <= MAX_VALOR_CONTA
    ? numero
    : null;
}

export function rascunhoValorConta(valor: Conta['valor']): string {
  return Number(valor).toFixed(2).replace('.', ',');
}

export function salvarValorConta(contaId: string, valor: number) {
  return api<ValorContaAtualizado>(`/contas/${contaId}/valor`, {
    method: 'PATCH',
    body: JSON.stringify({ valor }),
  });
}

export function aplicarValorConta(
  contas: Conta[] | null,
  atualizado: ValorContaAtualizado,
): Conta[] | null {
  return (
    contas?.map((conta) =>
      conta.id === atualizado.id
        ? { ...conta, valor: atualizado.valor }
        : conta,
    ) ?? null
  );
}
