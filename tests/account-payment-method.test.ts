import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  aplicarFormaPagamento,
  salvarFormaPagamento,
} from '../src/lib/account-payment-method';
import { AccountsTable } from '../src/components/accounts-table';
import type { Conta, FormaPagamento } from '../src/lib/types';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const forma: FormaPagamento = {
  id: '84933758-d41a-45cf-9116-62c2b7ccfb43',
  nome: 'Pix',
  createdAt: '2026-10-01T12:00:00Z',
  updatedAt: '2026-10-01T12:00:00Z',
};
const outraForma = {
  ...forma,
  id: 'af53c8b1-17a6-4a2d-8837-009706243954',
  nome: 'Cartão',
};
const conta: Conta = {
  id: 'ef53c8b1-17a6-4a2d-8837-009706243954',
  nome: 'Internet',
  valor: 100,
  pago: true,
  mes: '2026-10',
  mesReferencia: '2026-10',
  mesFim: null,
  recorrencia: true,
  parcela: 1,
  parcelaAtual: null,
  dataHoraPagamento: '2026-10-02T12:00:00Z',
  createdAt: forma.createdAt,
  updatedAt: forma.updatedAt,
  formaPagamentoId: forma.id,
  formaPagamento: { id: forma.id, nome: forma.nome },
};
const tableProps = {
  contas: [conta],
  paymentMethods: [forma, outraForma],
  onPaymentMethodChange: () => {},
};

test('listagem oferece combobox com vínculo selecionado e opção de remover', () => {
  const html = renderToStaticMarkup(createElement(AccountsTable, tableProps));
  assert.match(html, /aria-label="Forma de pagamento de Internet"/);
  assert.match(html, new RegExp(`value="${forma.id}" selected=""`));
  assert.match(html, /value="">Não informada/);
  assert.match(html, /Cartão/);
  assert.match(html, /todos os meses e parcelas/);
  assert.doesNotMatch(html, /disabled=""|Salvando/);
});

test('combobox mostra escolha pendente e bloqueia controles durante o salvamento', () => {
  const html = renderToStaticMarkup(
    createElement(AccountsTable, {
      ...tableProps,
      busyId: conta.id,
      onPay: () => {},
      onDelete: () => {},
      pendingPaymentMethod: { id: conta.id, formaPagamentoId: outraForma.id },
    }),
  );
  assert.match(html, new RegExp(`value="${outraForma.id}" selected=""`));
  assert.match(html, /disabled=""/);
  assert.match(html, /role="status">Salvando/);
  const removendo = renderToStaticMarkup(
    createElement(AccountsTable, {
      ...tableProps,
      pendingPaymentMethod: { id: conta.id, formaPagamentoId: null },
    }),
  );
  assert.match(removendo, /value="" selected="">Não informada/);
});

test('sem acesso às opções, mostra vínculo atual e mantém seleção bloqueada', () => {
  const html = renderToStaticMarkup(
    createElement(AccountsTable, {
      ...tableProps,
      paymentMethods: [],
      methodSelectionDisabled: true,
    }),
  );
  assert.match(html, new RegExp(`value="${forma.id}" disabled="" selected=""`));
  assert.match(html, /Pix/);
  assert.match(html, /select[^>]*disabled=""/);
});

test('visão geral continua somente para leitura sem combobox', () => {
  const html = renderToStaticMarkup(
    createElement(AccountsTable, { contas: [conta] }),
  );
  assert.match(html, /Pix/);
  assert.doesNotMatch(html, /<select/);
});

test('salvamento rápido envia PATCH com apenas UUID ou null e usa resposta da API', async () => {
  for (const formaPagamentoId of [outraForma.id, null]) {
    const vinculo = {
      id: conta.id,
      formaPagamentoId,
      formaPagamento: formaPagamentoId
        ? { id: outraForma.id, nome: outraForma.nome }
        : null,
    };
    globalThis.fetch = async (input, options) => {
      assert.equal(input, `/api/backend/contas/${conta.id}`);
      assert.equal(options?.method, 'PATCH');
      assert.deepEqual(JSON.parse(options?.body as string), {
        formaPagamentoId,
      });
      return Response.json(vinculo);
    };
    assert.deepEqual(
      await salvarFormaPagamento(conta.id, formaPagamentoId),
      vinculo,
    );
  }
});

test('falha da API é propagada sem alterar o estado anterior', async () => {
  globalThis.fetch = async () =>
    Response.json(
      { message: 'Conta ou forma de pagamento não encontrada.' },
      { status: 404 },
    );
  await assert.rejects(salvarFormaPagamento(conta.id, outraForma.id), {
    name: 'ApiError',
    status: 404,
    message: 'Conta ou forma de pagamento não encontrada.',
  });
  assert.equal(conta.formaPagamentoId, forma.id);
});

test('aplica somente o vínculo sem alterar mês, parcelas ou pagamento e preserva outras linhas', () => {
  const outraConta = { ...conta, id: 'outra-conta' };
  const vinculo = {
    id: conta.id,
    formaPagamentoId: outraForma.id,
    formaPagamento: { id: outraForma.id, nome: outraForma.nome },
    pago: false,
    mes: '2030-01',
  };
  const resultado = aplicarFormaPagamento([conta, outraConta], vinculo)!;
  assert.deepEqual(resultado[0], {
    ...conta,
    formaPagamentoId: outraForma.id,
    formaPagamento: vinculo.formaPagamento,
  });
  assert.equal(resultado[1], outraConta);
  assert.equal(conta.formaPagamentoId, forma.id);
  assert.equal(aplicarFormaPagamento(null, vinculo), null);
  const removida = aplicarFormaPagamento(resultado, {
    id: conta.id,
    formaPagamentoId: null,
    formaPagamento: null,
  })!;
  assert.equal(removida[0].formaPagamentoId, null);
  assert.equal(removida[0].formaPagamento, null);
  assert.equal(removida[0].pago, true);
});
