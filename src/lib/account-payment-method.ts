import { api } from './api';
import type { Conta } from './types';

export type VinculoFormaPagamento = Pick<
  Conta,
  'id' | 'formaPagamentoId' | 'formaPagamento'
>;

export function salvarFormaPagamento(
  contaId: string,
  formaPagamentoId: string | null,
) {
  return api<VinculoFormaPagamento>(`/contas/${contaId}`, {
    method: 'PATCH',
    body: JSON.stringify({ formaPagamentoId }),
  });
}

export function aplicarFormaPagamento(
  contas: Conta[] | null,
  vinculo: VinculoFormaPagamento,
): Conta[] | null {
  return (
    contas?.map((conta) =>
      conta.id === vinculo.id
        ? {
            ...conta,
            formaPagamentoId: vinculo.formaPagamentoId,
            formaPagamento: vinculo.formaPagamento,
          }
        : conta,
    ) ?? null
  );
}
