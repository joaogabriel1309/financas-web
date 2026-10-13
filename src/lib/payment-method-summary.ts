import type { Conta, FormaPagamento } from './types';
import type { PaymentMethodAppearance } from './payment-method-appearance';

export const ALL_PAYMENT_METHODS = 'all';
export const UNASSIGNED_PAYMENT_METHOD = 'unassigned';

export interface PaymentMethodTotal {
  id: string;
  forma: PaymentMethodAppearance | null;
  quantidade: number;
  total: bigint;
  pago: bigint;
  emAberto: bigint;
}

// A API retorna valores não negativos com, no máximo, duas casas decimais.
// Centavos inteiros evitam arredondamentos, inclusive em somas muito grandes.
function centavos(valor: Conta['valor']): bigint {
  const [inteiro, fracao = ''] = String(valor).split('.');
  return BigInt(inteiro) * 100n + BigInt(fracao.padEnd(2, '0'));
}

export function somarValoresContas(contas: readonly Conta[]): bigint {
  return contas.reduce((total, conta) => total + centavos(conta.valor), 0n);
}

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function moedaCentavos(valor: bigint): string {
  const fracao = (valor % 100n).toString().padStart(2, '0');
  return currency
    .formatToParts(valor / 100n)
    .map((parte) => (parte.type === 'fraction' ? fracao : parte.value))
    .join('');
}

function novoTotal(
  id: string,
  forma: PaymentMethodAppearance | null = null,
): PaymentMethodTotal {
  return { id, forma, quantidade: 0, total: 0n, pago: 0n, emAberto: 0n };
}

export function resumirFormasPagamento(
  contas: readonly Conta[],
  formas: readonly FormaPagamento[],
): PaymentMethodTotal[] {
  const todas = novoTotal(ALL_PAYMENT_METHODS);
  const semForma = novoTotal(UNASSIGNED_PAYMENT_METHOD);
  const grupos = new Map<string, PaymentMethodTotal>();
  for (const forma of formas) grupos.set(forma.id, novoTotal(forma.id, forma));
  grupos.set(semForma.id, semForma);

  for (const conta of contas) {
    const id = conta.formaPagamentoId ?? UNASSIGNED_PAYMENT_METHOD;
    const grupo = grupos.get(id) ?? novoTotal(id, conta.formaPagamento);
    // A conta pode ter sido recarregada mais recentemente que o cadastro de formas.
    if (conta.formaPagamento) grupo.forma = conta.formaPagamento;
    grupos.set(id, grupo);
    const valor = centavos(conta.valor);
    for (const destino of [todas, grupo]) {
      destino.quantidade += 1;
      destino.total += valor;
      if (conta.pago) destino.pago += valor;
      else destino.emAberto += valor;
    }
  }

  const porNome = [...grupos.values()]
    .filter((grupo) => grupo.id !== UNASSIGNED_PAYMENT_METHOD)
    .sort((a, b) =>
      (a.forma?.nome ?? '').localeCompare(b.forma?.nome ?? '', 'pt-BR'),
    );
  return [todas, ...porNome, semForma];
}

export function nomeResumoPagamento(grupo: PaymentMethodTotal): string {
  if (grupo.id === ALL_PAYMENT_METHODS) return 'Todas as formas';
  if (grupo.id === UNASSIGNED_PAYMENT_METHOD) return 'Não informada';
  return grupo.forma?.nome ?? 'Forma de pagamento';
}
