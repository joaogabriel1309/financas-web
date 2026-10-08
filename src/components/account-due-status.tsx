import type { Conta } from '@/lib/types';

const statuses: Record<
  Conta['situacaoVencimento'],
  { label: string; className: string }
> = {
  paga: { label: 'Paga', className: 'paid' },
  em_aberto: { label: 'Em aberto', className: 'pending' },
  atrasada: { label: 'Atrasada', className: 'overdue' },
  vence_hoje: { label: 'Vence hoje', className: 'due-today' },
  proxima: { label: 'Próxima do vencimento', className: 'due-soon' },
};

export function AccountDueStatus({ conta }: { conta: Conta }) {
  const status =
    statuses[conta.pago ? 'paga' : conta.situacaoVencimento] ??
    statuses.em_aberto;

  return (
    <span className={`badge ${status.className}`}>
      <span aria-hidden="true" />
      {status.label}
    </span>
  );
}
